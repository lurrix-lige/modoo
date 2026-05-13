import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { UnifiedAudioPlayer, setupAudioMode, validateUrl } from './AudioCore';
import { audioFocusManager, FocusAction } from './AudioFocusManager';
import { logger } from '../utils/logger';

interface AudioContextType {
  isPlaying: boolean;
  progress: number;
  duration: number;
  isBuffering: boolean;
  play: (url: string) => Promise<boolean>;
  pause: () => void;
  resume: () => Promise<boolean>;
  stop: () => void;
  seekTo: (position: number) => Promise<void>;
  setVolume: (volume: number) => void;
  isLoading: boolean;
  error: string | null;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<UnifiedAudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);
  const volumeRef = useRef(1.0);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      logger.debug('Initializing audio provider');
      await setupAudioMode();
      playerRef.current = new UnifiedAudioPlayer();
      playerRef.current.setProgressUpdateCallback((progressVal, durationVal) => {
        setProgress(progressVal);
        setDuration(durationVal);
      });
      playerRef.current.setCompletionCallback(() => {
        setIsPlaying(false);
      });
      playerRef.current.setPlayingStateCallback((playing) => {
        logger.debug('Audio playing state changed', { playing });
        setIsPlaying(playing);
      });
      playerRef.current.setBufferingCallback((buffering) => {
        setIsBuffering(buffering);
      });
      isInitializedRef.current = true;
      logger.info('AudioProvider initialized successfully');
    };

    initAudio();

    return () => {
      playerRef.current?.unloadAll();
      audioFocusManager.release('story');
    };
  }, []);

  const play = useCallback(async (url: string, retryCount: number = 0): Promise<boolean> => {
    logger.info('[AudioProvider] play called with URL', { url, isInitialized: isInitializedRef.current, playerExists: !!playerRef.current });

    if (!isInitializedRef.current) {
      logger.info('[AudioProvider] Waiting for initialization...');
      await new Promise(resolve => setTimeout(resolve, 100));
      return play(url, retryCount);
    }

    if (!playerRef.current) {
      logger.error('[AudioProvider] Player reference is null');
      return false;
    }

    currentUrlRef.current = url;

    setIsLoading(true);
    setError(null);

    const validationResult = validateUrl(url);
    if (!validationResult.valid) {
      const errorMsg = validationResult.message || 'Invalid audio URL';
      setError(errorMsg);
      setIsLoading(false);
      setIsPlaying(false);
      return false;
    }

    try {
      logger.info('[AudioProvider] Calling UnifiedAudioPlayer.play()', { url });
      const success = await playerRef.current?.play({
        tracks: [{
          id: 'main',
          url,
          volume: volumeRef.current,
          loop: false,
          role: 'main',
        }],
        retryConfig: { maxRetries: 2, delayMs: 1000 },
      });

      logger.info('[AudioProvider] UnifiedAudioPlayer.play() returned', { success });

      if (success) {
        audioFocusManager.request('story', 'main', (action: FocusAction) => {
          if (action === 'stop') {
            playerRef.current?.unloadAll();
            audioFocusManager.release('story');
            setIsPlaying(false);
            setProgress(0);
            setDuration(0);
          }
        });
        setIsPlaying(true);
        setIsLoading(false);
        logger.info('[AudioProvider] Audio playback started successfully');
        return true;
      } else {
        if (retryCount < 2) {
          logger.info(`[AudioProvider] Retrying audio playback (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return play(url, retryCount + 1);
        }
        setError('Failed to play audio after retries');
        setIsLoading(false);
        setIsPlaying(false);
        return false;
      }
    } catch (err) {
      logger.error('[AudioProvider] Exception caught during playback', { err });
      setError('Playback failed');
      setIsLoading(false);
      setIsPlaying(false);
      return false;
    }
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(async (): Promise<boolean> => {
    logger.debug('AudioProvider.resume called');

    if (playerRef.current?.isCompletedState()) {
      logger.debug('Resume detected completed state, attempting replay');
      const success = await playerRef.current.replay();
      if (success) {
        setIsPlaying(true);
        return true;
      }
      return false;
    }

    const success = await playerRef.current?.resume() ?? false;
    if (success) {
      setIsPlaying(true);
    }
    return success;
  }, []);

  const stop = useCallback(() => {
    audioFocusManager.release('story');
    playerRef.current?.unloadAll();
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    currentUrlRef.current = null;
  }, []);

  const seekTo = useCallback(async (position: number) => {
    logger.debug('AudioProvider.seekTo called with position', { position });
    await playerRef.current?.seekTo(position);
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    volumeRef.current = clampedVolume;
    playerRef.current?.setVolume('main', clampedVolume);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        progress,
        duration,
        isBuffering,
        play,
        pause,
        resume,
        stop,
        seekTo,
        setVolume,
        isLoading,
        error,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}