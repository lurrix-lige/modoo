import { useRef, useState, useCallback, useEffect } from 'react';
import { UnifiedAudioPlayer, setupAudioMode } from '../providers/AudioCore';
import { audioFocusManager, FocusAction } from '../providers/AudioFocusManager';
import { logger } from '../utils/logger';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export function useAudioPlayer() {
  const playerRef = useRef<UnifiedAudioPlayer | null>(null);
  const volumeRef = useRef(0.6);
  const focusIdRef = useRef('');
  const trackMapRef = useRef<Map<string, { url: string; volume: number }>>(new Map());
  if (!focusIdRef.current) {
    focusIdRef.current = `wn_${Math.random().toString(36).slice(2)}`;
  }
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.6,
  });
  const [activeTrackIds, setActiveTrackIds] = useState<string[]>([]);

  const syncActiveIds = useCallback(() => {
    setActiveTrackIds([...trackMapRef.current.keys()]);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await setupAudioMode();
      if (!mounted) return;

      const player = new UnifiedAudioPlayer();
      player.addProgressListener((progress, duration) => {
        if (!mounted) return;
        setState((prev) => ({ ...prev, currentTime: progress, duration }));
      });
      player.addPlayingStateListener((playing) => {
        if (!mounted) return;
        setState((prev) => ({ ...prev, isPlaying: playing }));
      });
      player.addCompletionListener(() => {
        if (!mounted) return;
        if (trackMapRef.current.size > 0) {
          logger.debug('White noise completed unexpectedly, auto-restarting');
          playerRef.current?.replay().catch(() => {
            const tracks = [...trackMapRef.current.entries()].map(([id, info]) => ({
              id,
              url: info.url,
              volume: info.volume,
              loop: true,
              role: 'background' as const,
            }));
            if (tracks.length > 0) {
              playerRef.current?.play({ tracks });
            }
          });
        } else {
          setState((prev) => ({ ...prev, isPlaying: false }));
        }
      });
      playerRef.current = player;
    };

    init();

    return () => {
      mounted = false;
      audioFocusManager.release(focusIdRef.current);
      playerRef.current?.unloadAll();
    };
  }, []);

  const hasActiveTracks = useCallback(() => trackMapRef.current.size > 0, []);

  const registerFocus = useCallback(() => {
    audioFocusManager.request(focusIdRef.current, 'background', (action: FocusAction) => {
      switch (action) {
        case 'duck':
          for (const [trackId] of trackMapRef.current) {
            playerRef.current?.setVolume(trackId, 0.15);
          }
          break;
        case 'restore':
          for (const [trackId, info] of trackMapRef.current) {
            playerRef.current?.setVolume(trackId, info.volume);
          }
          break;
        case 'stop':
          trackMapRef.current.clear();
          syncActiveIds();
          playerRef.current?.unloadAll();
          audioFocusManager.release(focusIdRef.current);
          setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
          break;
      }
    });
  }, [syncActiveIds]);

  const play = useCallback(
    async (src: string): Promise<boolean> => {
      try {
        if (!playerRef.current) {
          logger.error('useAudioPlayer: player not initialized');
          return false;
        }

        trackMapRef.current.clear();

        await playerRef.current.unloadAll();

        const success = await playerRef.current.play({
          tracks: [
            {
              id: 'main',
              url: src,
              volume: volumeRef.current,
              loop: true,
              role: 'main',
            },
          ],
        });

        if (success) {
          trackMapRef.current.set('main', { url: src, volume: volumeRef.current });
          syncActiveIds();
          registerFocus();
          setState((prev) => ({ ...prev, isPlaying: true }));
        }
        return success;
      } catch (error) {
        logger.error('Failed to play audio', { error });
        setState((prev) => ({ ...prev, isPlaying: false }));
        return false;
      }
    },
    [syncActiveIds, registerFocus],
  );

  const addTrack = useCallback(
    async (id: string, url: string, volume?: number): Promise<boolean> => {
      if (!playerRef.current) {
        logger.error('useAudioPlayer: player not initialized');
        return false;
      }

      if (trackMapRef.current.has(id)) {
        logger.debug('Track already active', { id });
        return false;
      }

      const trackVolume = Math.max(0, Math.min(1, volume ?? volumeRef.current));
      const success = await playerRef.current.addTrack({
        id,
        url,
        volume: trackVolume,
        loop: true,
        role: 'background',
      });

      if (success) {
        trackMapRef.current.set(id, { url, volume: trackVolume });
        syncActiveIds();

        if (trackMapRef.current.size === 1) {
          registerFocus();
        }

        setState((prev) => ({ ...prev, isPlaying: true, volume: trackVolume }));
      }

      return success;
    },
    [syncActiveIds, registerFocus],
  );

  const removeTrack = useCallback(
    async (id: string): Promise<void> => {
      if (!playerRef.current) return;

      trackMapRef.current.delete(id);
      syncActiveIds();
      await playerRef.current.removeTrack(id);

      if (trackMapRef.current.size === 0) {
        audioFocusManager.release(focusIdRef.current);
        setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
      }
    },
    [syncActiveIds],
  );

  const toggleTrack = useCallback(
    async (id: string, url: string, volume?: number): Promise<boolean> => {
      if (trackMapRef.current.has(id)) {
        await removeTrack(id);
        return false;
      }
      return await addTrack(id, url, volume);
    },
    [addTrack, removeTrack],
  );

  const hasTrack = useCallback((id: string): boolean => {
    return trackMapRef.current.has(id);
  }, []);

  const pause = useCallback(() => {
    try {
      playerRef.current?.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    } catch (error) {
      logger.error('Failed to pause audio', { error });
    }
  }, []);

  const resume = useCallback(async (): Promise<boolean> => {
    try {
      if (playerRef.current?.isCompletedState()) {
        const success = await playerRef.current.replay();
        if (success) {
          setState((prev) => ({ ...prev, isPlaying: true }));
          return true;
        }
        return false;
      }
      const success = (await playerRef.current?.resume()) ?? false;
      if (success) {
        setState((prev) => ({ ...prev, isPlaying: true }));
      }
      return success;
    } catch (error) {
      logger.error('Failed to resume audio', { error });
      return false;
    }
  }, []);

  const toggle = useCallback(
    async (src: string): Promise<boolean> => {
      if (state.isPlaying) {
        pause();
        return false;
      }
      return await play(src);
    },
    [state.isPlaying, pause, play],
  );

  const stop = useCallback(() => {
    try {
      trackMapRef.current.clear();
      syncActiveIds();
      audioFocusManager.release(focusIdRef.current);
      playerRef.current?.unloadAll();
      setState({ isPlaying: false, currentTime: 0, duration: 0, volume: volumeRef.current });
    } catch (error) {
      logger.error('Failed to stop audio', { error });
    }
  }, [syncActiveIds]);

  const setVolume = useCallback((volume: number) => {
    const safeVolume =
      volume == null || isNaN(volume) || !isFinite(volume) ? volumeRef.current : volume;
    const clampedVolume = Math.max(0, Math.min(1, safeVolume));
    volumeRef.current = clampedVolume;
    for (const trackId of trackMapRef.current.keys()) {
      playerRef.current?.setVolume(trackId, clampedVolume);
    }
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  const pauseTrack = useCallback((id: string) => {
    try {
      playerRef.current?.pauseTrack(id);
    } catch (error) {
      logger.error('Failed to pause track', { id, error });
    }
  }, []);

  const resumeTrack = useCallback(async (id: string): Promise<boolean> => {
    try {
      return (await playerRef.current?.resumeTrack(id)) ?? false;
    } catch (error) {
      logger.error('Failed to resume track', { id, error });
      return false;
    }
  }, []);

  return {
    ...state,
    activeTrackIds,
    play,
    pause,
    resume,
    pauseTrack,
    resumeTrack,
    toggle,
    stop,
    setVolume,
    addTrack,
    removeTrack,
    toggleTrack,
    hasTrack,
  };
}
