import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { validateUrl } from './AudioCore';
import { audioFocusManager, FocusAction } from './AudioFocusManager';
import { useUnifiedAudio } from './UnifiedAudioProvider';
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
  const unifiedAudio = useUnifiedAudio();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const volumeRef = useRef(1.0);

  const play = useCallback(
    async (url: string, retryCount: number = 0): Promise<boolean> => {
      logger.info('[AudioProvider] play called with URL', { url });

      setIsLoading(true);
      setError(null);

      const validationResult = validateUrl(url);
      if (!validationResult.valid) {
        const errorMsg = validationResult.message || 'Invalid audio URL';
        setError(errorMsg);
        setIsLoading(false);
        return false;
      }

      try {
        logger.info('[AudioProvider] Calling UnifiedAudioPlayer.play()', { url });
        const success = await unifiedAudio.play({
          tracks: [
            {
              id: 'main',
              url,
              volume: volumeRef.current,
              loop: false,
              role: 'main',
            },
          ],
          retryConfig: { maxRetries: 2, delayMs: 1000 },
        });

        logger.info('[AudioProvider] UnifiedAudioPlayer.play() returned', { success });

        if (success) {
          audioFocusManager.request('story', 'main', (action: FocusAction) => {
            if (action === 'stop') {
              unifiedAudio.stop();
              audioFocusManager.release('story');
              setError(null);
            }
          });
          setIsLoading(false);
          return true;
        } else {
          if (retryCount < 2) {
            logger.info(`[AudioProvider] Retrying audio playback (attempt ${retryCount + 1}/3)`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return play(url, retryCount + 1);
          }
          setError('Failed to play audio after retries');
          setIsLoading(false);
          return false;
        }
      } catch (err) {
        logger.error('[AudioProvider] Exception caught during playback', { err });
        setError('Playback failed');
        setIsLoading(false);
        return false;
      }
    },
    [unifiedAudio],
  );

  const pause = useCallback(() => {
    unifiedAudio.pause();
  }, [unifiedAudio]);

  const resume = useCallback(async (): Promise<boolean> => {
    logger.debug('AudioProvider.resume called');

    if (unifiedAudio.isPlaying) {
      return true;
    }

    const success = await unifiedAudio.resume();
    if (success) {
      return true;
    }
    return false;
  }, [unifiedAudio]);

  const stop = useCallback(() => {
    audioFocusManager.release('story');
    unifiedAudio.stop();
    setError(null);
  }, [unifiedAudio]);

  const seekTo = useCallback(
    async (position: number) => {
      logger.debug('AudioProvider.seekTo called with position', { position });
      await unifiedAudio.seekTo(position);
    },
    [unifiedAudio],
  );

  const setVolume = useCallback(
    (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      volumeRef.current = clampedVolume;
      unifiedAudio.setVolume('main', clampedVolume);
    },
    [unifiedAudio],
  );

  return (
    <AudioContext.Provider
      value={{
        isPlaying: unifiedAudio.isPlaying,
        progress: unifiedAudio.progress,
        duration: unifiedAudio.duration,
        isBuffering: unifiedAudio.isBuffering,
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
