import { createAudioPlayer, setAudioModeAsync, AudioStatus, AudioPlayer } from 'expo-audio';
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
  private generation = 0;
  private progressUpdateCallback?: (progress: number, duration: number) => void;
  private completionCallback?: () => void;
  private playingStateCallback?: (isPlaying: boolean) => void;
  private bufferingCallback?: (isBuffering: boolean) => void;

  setProgressUpdateCallback(callback: (progress: number, duration: number) => void): void {
    this.progressUpdateCallback = callback;
  }

  setCompletionCallback(callback: () => void): void {
    this.completionCallback = callback;
  }

  setPlayingStateCallback(callback: (isPlaying: boolean) => void): void {
    this.playingStateCallback = callback;
  }

  setBufferingCallback(callback: (isBuffering: boolean) => void): void {
    this.bufferingCallback = callback;
  }

  isPlaying(): boolean {
    return !this.isCompleted && !this.isEmpty();
  }

  async play(config: AudioPlayerConfig): Promise<boolean> {
    // 递增代数，使旧会话的所有回调和 unloadAll 失效
    this.generation++;
    const currentGen = this.generation;
    this.isProcessing = true;

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

      for (const track of config.tracks) {
        const validation = validateUrl(track.url);
        if (!validation.valid) {
          logger.error('Invalid track URL', { url: track.url, message: validation.message });
          continue;
        }

        const encodedUrl = encodeUrl(track.url);
        const player = createAudioPlayer(encodedUrl, { updateInterval });
        player.loop = track.loop ?? false;
        const volume = track.volume ?? 1.0;
        player.volume = volume;
        logger.debug(`Created audio player for ${track.url} with volume ${volume}`);

        if (track.role === 'main') {
          player.addListener(PLAYBACK_STATUS_UPDATE, (status: AudioStatus) => {
            // 忽略旧会话的状态回调
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
            }

            const progress = sanitizeTimeValue(status.currentTime);
            const duration = sanitizeTimeValue(status.duration);
            this.currentDuration = duration;

            this.lastSeekPosition = progress;

            if (isActuallyPlaying !== this.isPlayingInternal) {
              this.isPlayingInternal = isActuallyPlaying;
              this.playingStateCallback?.(this.isPlayingInternal);
            }

            const isBuffering = status.isBuffering === true;
            if (isBuffering !== this.isBufferingInternal) {
              this.isBufferingInternal = isBuffering;
              this.bufferingCallback?.(isBuffering);
            }

            if (!this.suppressProgressUpdate) {
              this.progressUpdateCallback?.(progress, duration);
            }

            // Seek 期间抑制 didJustFinish，防止快进到末尾被误判为播放完成
            if (status.didJustFinish && !status.loop && !this.isCompleted && !this.isSeeking) {
              this.isCompleted = true;
              this.isPlayingInternal = false;
              this.progressUpdateCallback?.(duration, duration);
              this.completionCallback?.();
              this.playingStateCallback?.(false);
            }
          });
        }

        this.players.set(track.id, player);
        hasValidTrack = true;
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
      this.playingStateCallback?.(true);
      this.isProcessing = false;
      return true;
    } catch (err) {
      logger.error('Failed to play audio', { err });
      for (const player of this.players.values()) {
        try { player.remove(); } catch (e) { /* ignore */ }
      }
      this.players.clear();
      this.isPlayingInternal = false;
      this.playingStateCallback?.(false);
      this.isProcessing = false;
      return false;
    }
  }

  async replay(): Promise<boolean> {
    if (this.isEmpty()) {
      return false;
    }

    this.generation++;
    this.isProcessing = true;

    try {
      this.isCompleted = false;

      for (const player of this.players.values()) {
        await player.seekTo(0);
        player.play();
      }

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
      this.playingStateCallback?.(false);
    } catch (err) {
      logger.debug('Pause failed', { error: err });
    }
  }

  async resume(): Promise<boolean> {
    try {
      for (const player of this.players.values()) {
        await player.play();
      }
      this.isPlayingInternal = true;
      this.playingStateCallback?.(true);
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

    const clampedPosition = Math.max(0, Math.min(position, this.currentDuration));
    
    if (this.isCompleted) {
      this.isCompleted = false;
    }

    try {
      const seekPromises: Promise<void>[] = [];
      for (const player of this.players.values()) {
        seekPromises.push(player.seekTo(clampedPosition));
      }
      
      await Promise.all(seekPromises);
      
      this.lastSeekPosition = clampedPosition;
      this.progressUpdateCallback?.(clampedPosition, this.currentDuration);
    } catch (err) {
      logger.debug('Seek failed', { error: err });
    } finally {
      setTimeout(() => {
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