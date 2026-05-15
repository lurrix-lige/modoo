import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { UnifiedAudioPlayer, AudioTrack, AudioPlayerConfig, setupAudioMode, validateUrl, encodeUrl } from './AudioCore';
import { logger } from '../utils/logger';

export interface UnifiedAudioContextType {
  isPlaying: boolean;
  progress: number;
  duration: number;
  isBuffering: boolean;
  isLoading: boolean;
  error: string | null;
  play: (config: AudioPlayerConfig) => Promise<boolean>;
  pause: () => void;
  resume: () => Promise<boolean>;
  stop: () => void;
  seekTo: (position: number) => Promise<void>;
  setVolume: (trackId: string, volume: number) => void;
  getVolume: (trackId: string) => number;
}

const UnifiedAudioContext = createContext<UnifiedAudioContextType | undefined>(undefined);

export function UnifiedAudioProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<UnifiedAudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await setupAudioMode();
      if (!mounted) return;

      const player = new UnifiedAudioPlayer();
      player.addProgressListener((progressVal, durationVal) => {
        setProgress(progressVal);
        setDuration(durationVal);
      });
      player.addCompletionListener(() => {
        setIsPlaying(false);
        setProgress(0);
      });
      player.addPlayingStateListener((playing) => {
        setIsPlaying(playing);
      });
      player.addBufferingListener((buffering) => {
        setIsBuffering(buffering);
      });
      player.setMetricsCallback((metrics) => {
        logger.info('Audio playback metrics', { ...metrics });
      });
      playerRef.current = player;
    };

    init();

    return () => {
      mounted = false;
      playerRef.current?.unloadAll();
    };
  }, []);

  const play = useCallback(async (config: AudioPlayerConfig): Promise<boolean> => {
    logger.debug('UnifiedAudioProvider.play called with config', { config });
    setIsLoading(true);
    setError(null);

    for (const track of config.tracks) {
      const validation = validateUrl(track.url);
      if (!validation.valid) {
        const errorMsg = validation.message || 'Invalid audio URL';
        setError(errorMsg);
        setIsLoading(false);
        return false;
      }
    }

    const success = await playerRef.current?.play(config) ?? false;

    if (success) {
      setIsPlaying(true);
      setIsLoading(false);
    } else {
      setError('Failed to play audio');
      setIsLoading(false);
      setIsPlaying(false);
    }

    return success;
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(async (): Promise<boolean> => {
    const success = await playerRef.current?.resume() ?? false;
    if (success) {
      setIsPlaying(true);
    }
    return success;
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.unloadAll();
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const seekTo = useCallback(async (position: number) => {
    await playerRef.current?.seekTo(position);
    setProgress(position);
  }, []);

  const setVolume = useCallback((trackId: string, volume: number) => {
    playerRef.current?.setVolume(trackId, volume);
  }, []);

  const getVolume = useCallback((trackId: string): number => {
    return playerRef.current?.getVolume(trackId) ?? 1.0;
  }, []);

  return (
    <UnifiedAudioContext.Provider
      value={{
        isPlaying,
        progress,
        duration,
        isBuffering,
        isLoading,
        error,
        play,
        pause,
        resume,
        stop,
        seekTo,
        setVolume,
        getVolume,
      }}
    >
      {children}
    </UnifiedAudioContext.Provider>
  );
}

export function useUnifiedAudio() {
  const context = useContext(UnifiedAudioContext);
  if (context === undefined) {
    throw new Error('useUnifiedAudio must be used within a UnifiedAudioProvider');
  }
  return context;
}

export { AudioTrack, AudioPlayerConfig };
