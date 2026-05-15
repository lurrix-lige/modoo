import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync, AudioStatus, AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import i18n from '../i18n';
import { logger } from '../utils/logger';

export const PLAYBACK_STATUS_UPDATE = 'playbackStatusUpdate';

export interface AudioTrack {
  id: string;
  url: string;
  volume?: number;
  loop?: boolean;
  role: 'main' | 'background';
}

export interface AudioPlayerConfig {
  tracks: AudioTrack[];
  updateInterval?: number;
  retryConfig?: {
    maxRetries: number;
    delayMs: number;
  };
}

export interface PlaybackState {
  isPlaying: boolean;
  progress: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
}

export interface PlaybackMetrics {
  playLatencyMs: number;
  bufferEventCount: number;
  errorMessage?: string;
}

const SUPPORTED_EXTENSIONS_IOS = ['.mp3', '.aac', '.m4a', '.wav'];
const SUPPORTED_EXTENSIONS_ANDROID = ['.mp3', '.aac', '.m4a', '.wav', '.webm', '.ogg'];

export const sanitizeTimeValue = (value: number): number => {
  if (isNaN(value) || !isFinite(value) || value < 0) {
    return 0;
  }
  return value;
};

const getFileExtension = (url: string): string => {
  const match = url.match(/\.[0-9a-z]+$/i);
  return match ? match[0].toLowerCase() : '';
};

const isFormatSupported = (url: string): boolean => {
  const ext = getFileExtension(url);
  const supportedExtensions = Platform.OS === 'ios' ? SUPPORTED_EXTENSIONS_IOS : SUPPORTED_EXTENSIONS_ANDROID;
  return supportedExtensions.includes(ext);
};

export const validateUrl = (url: string): { valid: boolean; message?: string } => {
  if (!url || url.trim() === '') {
    logger.error('Audio URL is empty');
    return { valid: false, message: i18n.t('audio.emptyUrl') };
  }
  try {
    new URL(url);
  } catch {
    logger.error('Invalid audio URL', { url });
    return { valid: false, message: i18n.t('audio.invalidUrl') };
  }
  
  const ext = getFileExtension(url);
  const supportedExtensions = Platform.OS === 'ios' ? SUPPORTED_EXTENSIONS_IOS : SUPPORTED_EXTENSIONS_ANDROID;
  
  if (ext && !supportedExtensions.includes(ext)) {
    logger.warn(`Unsupported audio format: ${ext} on ${Platform.OS}, attempting to play anyway`);
    // 不阻止播放，只记录警告，让 expo-audio 决定是否能处理
  }
  
  return { valid: true };
};

export const encodeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    logger.debug('Encoding URL', { url: parsedUrl.toString() });
    parsedUrl.pathname = parsedUrl.pathname.split('/').map(segment => 
      encodeURIComponent(decodeURIComponent(segment))
    ).join('/');
    logger.debug('Encoded URL', { url: parsedUrl.toString() });
    return parsedUrl.toString();
  } catch {
    return url;
  }
};

export const setupAudioMode = async (): Promise<void> => {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
    await setIsAudioActiveAsync(true);
  } catch (err) {
    logger.warn('Failed to set audio mode', { error: err });
  }
};

export class UnifiedAudioPlayer {
  private players: Map<string, AudioPlayer> = new Map();
  private isProcessing = false;
  private isSeeking = false;
  private isCompleted = false;
  private isPlayingInternal = false;
  private isBufferingInternal = false;
  private currentDuration = 0;
  private lastSeekPosition = 0;
  private suppressProgressUpdate = false;
  private seekResetTimer: ReturnType<typeof setTimeout> | null = null;
  private primaryPlayerRef: AudioPlayer | null = null;
  private progressPollTimer: ReturnType<typeof setInterval> | null = null;
  private generation = 0;
  private progressUpdateListeners = new Set<(progress: number, duration: number) => void>();
  private completionListeners = new Set<() => void>();
  private playingStateListeners = new Set<(isPlaying: boolean) => void>();
  private bufferingListeners = new Set<(isBuffering: boolean) => void>();
  private metricsCallback?: (metrics: PlaybackMetrics) => void;

  // Per-session metrics
  private playStartTime = 0;
  private firstPlayingRecorded = false;
  private bufferEventCount = 0;

  addProgressListener(cb: (progress: number, duration: number) => void): void {
    this.progressUpdateListeners.add(cb);
  }

  removeProgressListener(cb: (progress: number, duration: number) => void): void {
    this.progressUpdateListeners.delete(cb);
  }

  addCompletionListener(cb: () => void): void {
    this.completionListeners.add(cb);
  }

  removeCompletionListener(cb: () => void): void {
    this.completionListeners.delete(cb);
  }

  addPlayingStateListener(cb: (isPlaying: boolean) => void): void {
    this.playingStateListeners.add(cb);
  }

  removePlayingStateListener(cb: (isPlaying: boolean) => void): void {
    this.playingStateListeners.delete(cb);
  }

  addBufferingListener(cb: (isBuffering: boolean) => void): void {
    this.bufferingListeners.add(cb);
  }

  removeBufferingListener(cb: (isBuffering: boolean) => void): void {
    this.bufferingListeners.delete(cb);
  }

  setMetricsCallback(cb: (metrics: PlaybackMetrics) => void): void {
    this.metricsCallback = cb;
  }

  private emitMetrics(errorMessage?: string): void {
    if (!this.metricsCallback) return;
    const latency = this.firstPlayingRecorded
      ? this.playStartTime > 0 ? Date.now() - this.playStartTime : 0
      : -1;
    this.metricsCallback({
      playLatencyMs: latency,
      bufferEventCount: this.bufferEventCount,
      errorMessage,
    });
  }

  private handlePlaybackStatusUpdate(status: AudioStatus, currentGen: number, trackLoop: boolean): void {
    if (this.generation !== currentGen) {
      return;
    }

    const isActuallyPlaying = status.isLoaded && status.playing === true;
    logger.debug('PLAYBACK_STATUS_UPDATE received', {
      generation: currentGen,
      isLoaded: status.isLoaded,
      playbackState: status.playbackState,
      timeControlStatus: (status as any).timeControlStatus,
      reasonForWaitingToPlay: (status as any).reasonForWaitingToPlay,
      playing: status.playing,
      currentTime: status.currentTime,
      duration: status.duration,
      isBuffering: status.isBuffering,
      didJustFinish: status.didJustFinish,
      error: (status as any).error,
    });

    if (!status.isLoaded) {
      return;
    }

    if (!status.playing && !status.isBuffering) {
      logger.warn('Audio loaded but not playing', {
        playbackState: status.playbackState,
        timeControlStatus: (status as any).timeControlStatus,
        reasonForWaitingToPlay: (status as any).reasonForWaitingToPlay,
      });
    }

    if ((status as any).error) {
      logger.error('Audio playback error detected', { error: (status as any).error });
      this.emitMetrics((status as any).error);
    }

    const progress = sanitizeTimeValue(status.currentTime);
    const duration = sanitizeTimeValue(status.duration);
    this.currentDuration = duration;

    this.lastSeekPosition = progress;

    if (isActuallyPlaying !== this.isPlayingInternal) {
      this.isPlayingInternal = isActuallyPlaying;
      this.playingStateListeners.forEach((cb) => cb(this.isPlayingInternal));

      if (isActuallyPlaying && !this.firstPlayingRecorded) {
        this.firstPlayingRecorded = true;
        const latency = Date.now() - this.playStartTime;
        logger.debug('First playing status reached', { latencyMs: latency });
      }
    }

    const isBuffering = status.isBuffering === true;
    if (isBuffering !== this.isBufferingInternal) {
      this.isBufferingInternal = isBuffering;
      this.bufferingListeners.forEach((cb) => cb(isBuffering));
      if (isBuffering) {
        this.bufferEventCount++;
      }
    }

    if (!this.suppressProgressUpdate) {
      this.progressUpdateListeners.forEach((cb) => cb(progress, duration));
    }

    if (status.didJustFinish && !trackLoop && !this.isCompleted && !this.isSeeking) {
      this.isCompleted = true;
      this.isPlayingInternal = false;
      this.progressUpdateListeners.forEach((cb) => cb(duration, duration));
      this.completionListeners.forEach((cb) => cb());
      this.playingStateListeners.forEach((cb) => cb(false));
      this.emitMetrics();
    }
  }

  private startProgressPolling(currentGen: number, intervalMs: number): void {
    this.stopProgressPolling();
    this.progressPollTimer = setInterval(() => {
      if (this.generation !== currentGen) {
        this.stopProgressPolling();
        return;
      }
      if (!this.primaryPlayerRef || this.suppressProgressUpdate) {
        return;
      }
      const rawProgress = this.primaryPlayerRef.currentTime;
      const rawDuration = this.primaryPlayerRef.duration;
      const progress = sanitizeTimeValue(rawProgress);
      const duration = sanitizeTimeValue(rawDuration);
      if (duration > 0) {
        this.currentDuration = duration;
      }
      this.progressUpdateListeners.forEach((cb) => cb(progress, duration));
    }, intervalMs);
  }

  private stopProgressPolling(): void {
    if (this.progressPollTimer) {
      clearInterval(this.progressPollTimer);
      this.progressPollTimer = null;
    }
  }

  isPlaying(): boolean {
    return !this.isCompleted && !this.isEmpty();
  }

  async play(config: AudioPlayerConfig): Promise<boolean> {
    // 递增代数，使旧会话的所有回调和 unloadAll 失效
    this.generation++;
    const currentGen = this.generation;
    this.isProcessing = true;

    // 清除上一次 seek 的延迟复位定时器，避免跨会话干扰
    if (this.seekResetTimer) {
      clearTimeout(this.seekResetTimer);
      this.seekResetTimer = null;
    }
    this.isSeeking = false;
    this.suppressProgressUpdate = false;

    // Reset per-session metrics
    this.playStartTime = Date.now();
    this.firstPlayingRecorded = false;
    this.bufferEventCount = 0;

    try {
      // 先清理所有旧播放器
      for (const player of this.players.values()) {
        try { player.remove(); } catch (err) { /* ignore */ }
      }
      this.players.clear();
      this.isCompleted = false;
      this.isPlayingInternal = false;

      const updateInterval = config.updateInterval || 100;
      let hasValidTrack = false;
      let primaryPlayer: AudioPlayer | null = null;
      let primaryTrackLoop = false;

      for (const track of config.tracks) {
        const validation = validateUrl(track.url);
        if (!validation.valid) {
          logger.error('Invalid track URL', { url: track.url, message: validation.message });
          continue;
        }

        const encodedUrl = encodeUrl(track.url);
        const player = createAudioPlayer(encodedUrl, { updateInterval, keepAudioSessionActive: true });
        player.loop = track.loop ?? false;
        const volume = track.volume ?? 1.0;
        player.volume = volume;
        logger.debug(`Created audio player for ${track.url} with volume ${volume}`);

        // 优先选择 main 角色的 track 作为进度更新源，没有则使用第一个可用 track
        if (!primaryPlayer || track.role === 'main') {
          primaryPlayer = player;
          primaryTrackLoop = track.loop ?? false;
        }

        this.players.set(track.id, player);
        hasValidTrack = true;
      }

      // 为选中的主播放器注册进度监听并启动轮询兜底
      if (primaryPlayer) {
        this.primaryPlayerRef = primaryPlayer;
        primaryPlayer.addListener(PLAYBACK_STATUS_UPDATE, (status: AudioStatus) => {
          this.handlePlaybackStatusUpdate(status, currentGen, primaryTrackLoop);
        });
        this.startProgressPolling(currentGen, updateInterval);
      }

      if (!hasValidTrack) {
        logger.error('No valid tracks provided');
        this.isProcessing = false;
        return false;
      }

      for (const player of this.players.values()) {
        try {
          player.play();
        } catch (playErr) {
          logger.error('Player.play() failed', { error: playErr });
        }
      }

      this.isPlayingInternal = true;
      this.playingStateListeners.forEach((cb) => cb(true));
      this.isProcessing = false;
      return true;
    } catch (err) {
      logger.error('Failed to play audio', { err });
      this.emitMetrics(String(err));
      for (const player of this.players.values()) {
        try { player.remove(); } catch (e) { /* ignore */ }
      }
      this.players.clear();
      this.isPlayingInternal = false;
      this.playingStateListeners.forEach((cb) => cb(false));
      this.isProcessing = false;
      return false;
    }
  }

  async addTrack(track: AudioTrack): Promise<boolean> {
    if (this.players.has(track.id)) {
      logger.debug('Track already exists', { trackId: track.id });
      return false;
    }

    const validation = validateUrl(track.url);
    if (!validation.valid) {
      logger.error('Invalid track URL for addTrack', { url: track.url, message: validation.message });
      return false;
    }

    const currentGen = this.generation;
    const encodedUrl = encodeUrl(track.url);
    const player = createAudioPlayer(encodedUrl, { keepAudioSessionActive: true });
    player.loop = track.loop ?? true;
    player.volume = track.volume ?? 1.0;

    player.addListener(PLAYBACK_STATUS_UPDATE, (status: AudioStatus) => {
      if (this.generation !== currentGen) {
        return;
      }

      if ((status as any).error) {
        logger.error('Audio track playback error', { trackId: track.id, error: (status as any).error });
      }

      const isActuallyPlaying = status.isLoaded && status.playing === true;

      if (!isActuallyPlaying && this.isPlayingInternal) {
        const anyPlaying = [...this.players.values()].some((p) => {
          try {
            return p.playing;
          } catch {
            return false;
          }
        });
        if (!anyPlaying) {
          this.isPlayingInternal = false;
          this.playingStateListeners.forEach((cb) => cb(false));
        }
      } else if (isActuallyPlaying && !this.isPlayingInternal) {
        this.isPlayingInternal = true;
        this.playingStateListeners.forEach((cb) => cb(true));
      }
    });

    this.players.set(track.id, player);
    player.play();
    logger.debug('Track added and playing', { trackId: track.id });

    if (!this.isPlayingInternal) {
      this.isPlayingInternal = true;
      this.playingStateListeners.forEach((cb) => cb(true));
    }

    return true;
  }

  async removeTrack(trackId: string): Promise<void> {
    const player = this.players.get(trackId);
    if (!player) {
      logger.debug('Track not found for removal', { trackId });
      return;
    }

    try {
      player.remove();
    } catch (err) {
      logger.debug('Error removing track player', { trackId, error: err });
    }

    this.players.delete(trackId);
    logger.debug('Track removed', { trackId });

    if (this.players.size === 0) {
      this.isPlayingInternal = false;
      this.isCompleted = false;
      this.playingStateListeners.forEach((cb) => cb(false));
    }
  }

  async replay(): Promise<boolean> {
    if (this.isEmpty()) {
      return false;
    }

    this.isProcessing = true;

    try {
      this.isCompleted = false;

      for (const player of this.players.values()) {
        // expo-audio 的 seekTo 需要毫秒
        await player.seekTo(0);
        player.play();
      }

      this.isPlayingInternal = true;
      this.playingStateListeners.forEach((cb) => cb(true));
      this.isProcessing = false;
      return true;
    } catch (err) {
      logger.error('Failed to replay audio', { err });
      this.isProcessing = false;
      return false;
    }
  }

  pause(): void {
    try {
      for (const player of this.players.values()) {
        player.pause();
      }
      this.isPlayingInternal = false;
      this.playingStateListeners.forEach((cb) => cb(false));
    } catch (err) {
      logger.debug('Pause failed', { error: err });
    }
  }

  pauseTrack(trackId: string): void {
    const player = this.players.get(trackId);
    if (player) {
      player.pause();
      logger.debug('Paused track', { trackId });
    }
  }

  async resumeTrack(trackId: string): Promise<boolean> {
    const player = this.players.get(trackId);
    if (player) {
      try {
        await player.play();
        logger.debug('Resumed track', { trackId });
        return true;
      } catch (err) {
        logger.debug('Resume track failed', { trackId, error: err });
        return false;
      }
    }
    return false;
  }

  async resume(): Promise<boolean> {
    if (this.isCompleted) {
      return this.replay();
    }

    try {
      for (const player of this.players.values()) {
        await player.play();
      }
      this.isPlayingInternal = true;
      this.playingStateListeners.forEach((cb) => cb(true));
      return true;
    } catch (err) {
      logger.debug('Resume failed', { error: err });
      return false;
    }
  }

  async seekTo(position: number): Promise<void> {
    if (this.isEmpty()) {
      logger.debug('Seek skipped - no players available');
      return;
    }

    if (this.isSeeking) {
      logger.debug('Seek skipped - already seeking');
      return;
    }

    this.isSeeking = true;
    this.suppressProgressUpdate = true;

    const maxPosition = this.currentDuration > 0 ? this.currentDuration : position;
    const clampedPosition = Math.max(0, Math.min(position, maxPosition));

    if (this.isCompleted) {
      this.isCompleted = false;
    }

    try {
      const seekPromises: Promise<void>[] = [];
      // expo-audio 的 seekTo 需要毫秒
      const seekPositionMs = clampedPosition * 1000;
      for (const player of this.players.values()) {
        seekPromises.push(player.seekTo(seekPositionMs));
      }

      await Promise.all(seekPromises);

      this.lastSeekPosition = clampedPosition;
      this.progressUpdateListeners.forEach((cb) => cb(clampedPosition, this.currentDuration));
    } catch (err) {
      logger.debug('Seek failed', { error: err });
    } finally {
      if (this.seekResetTimer) {
        clearTimeout(this.seekResetTimer);
      }
      this.seekResetTimer = setTimeout(() => {
        this.seekResetTimer = null;
        this.isSeeking = false;
        this.suppressProgressUpdate = false;
      }, 200);
    }
  }

  setVolume(trackId: string, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const player = this.players.get(trackId);
    if (player) {
      player.volume = clampedVolume;
    }
  }

  getVolume(trackId: string): number {
    const player = this.players.get(trackId);
    return player?.volume ?? 1.0;
  }

  isCompletedState(): boolean {
    return this.isCompleted;
  }

  async unloadAll(): Promise<void> {
    // 递增代数，使旧会话的所有待处理回调失效
    this.generation++;
    this.stopProgressPolling();
    this.primaryPlayerRef = null;
    for (const player of this.players.values()) {
      try {
        player.remove();
      } catch (err) {
        logger.debug('Error unloading player', { error: err });
      }
    }
    this.players.clear();
    this.isCompleted = false;
    this.isPlayingInternal = false;
    this.isProcessing = false;
    this.currentDuration = 0;
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  getDuration(): number {
    return this.currentDuration;
  }
}