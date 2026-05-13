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
  const volumeRef = useRef(1);
  const focusIdRef = useRef('');
  if (!focusIdRef.current) {
    focusIdRef.current = `wn_${Math.random().toString(36).slice(2)}`;
  }
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await setupAudioMode();
      if (!mounted) return;

      const player = new UnifiedAudioPlayer();
      player.setProgressUpdateCallback((progress, duration) => {
        if (!mounted) return;
        setState((prev) => ({ ...prev, currentTime: progress, duration }));
      });
      player.setPlayingStateCallback((playing) => {
        if (!mounted) return;
        setState((prev) => ({ ...prev, isPlaying: playing }));
      });
      player.setCompletionCallback(() => {
        if (!mounted) return;
        setState((prev) => ({ ...prev, isPlaying: false }));
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

  const play = useCallback(async (src: string): Promise<boolean> => {
    try {
      if (!playerRef.current) {
        logger.error('useAudioPlayer: player not initialized');
        return false;
      }

      await playerRef.current.unloadAll();

      const success = await playerRef.current.play({
        tracks: [{
          id: 'main',
          url: src,
          volume: volumeRef.current,
          loop: true,
          role: 'main',
        }],
      });

      if (success) {
        audioFocusManager.request(focusIdRef.current, 'background', (action: FocusAction) => {
          switch (action) {
            case 'duck':
              playerRef.current?.setVolume('main', 0.15);
              break;
            case 'restore':
              playerRef.current?.setVolume('main', volumeRef.current);
              break;
            case 'stop':
              playerRef.current?.unloadAll();
              audioFocusManager.release(focusIdRef.current);
              setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
              break;
          }
        });
        setState((prev) => ({ ...prev, isPlaying: true }));
      }
      return success;
    } catch (error) {
      logger.error('Failed to play audio', { error });
      setState((prev) => ({ ...prev, isPlaying: false }));
      return false;
    }
  }, []);

  const pause = useCallback(() => {
    try {
      playerRef.current?.pause();
      setState((prev) => ({ ...prev, isPlaying: false }));
    } catch (error) {
      logger.error('Failed to pause audio', { error });
    }
  }, []);

  const toggle = useCallback(async (src: string): Promise<boolean> => {
    if (state.isPlaying) {
      pause();
      return false;
    }
    return await play(src);
  }, [state.isPlaying, pause, play]);

  const stop = useCallback(() => {
    try {
      audioFocusManager.release(focusIdRef.current);
      playerRef.current?.unloadAll();
      setState({ isPlaying: false, currentTime: 0, duration: 0, volume: volumeRef.current });
    } catch (error) {
      logger.error('Failed to stop audio', { error });
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    volumeRef.current = clampedVolume;
    playerRef.current?.setVolume('main', clampedVolume);
    setState((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  return {
    ...state,
    play,
    pause,
    toggle,
    stop,
    setVolume,
  };
}
