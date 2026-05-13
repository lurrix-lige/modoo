import { useRef, useState, useCallback, useEffect } from 'react';
import { createAudioPlayer, setAudioModeAsync, AudioStatus, AudioPlayer } from 'expo-audio';
import { logger } from '../utils/logger';

const PLAYBACK_STATUS_UPDATE = 'playbackStatusUpdate';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export function useAudioPlayer() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });

  const loadAudio = useCallback(async (src: string) => {
    try {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
      });

      const player = createAudioPlayer(src, {
        updateInterval: 100,
      });

      player.addListener(PLAYBACK_STATUS_UPDATE, (status: AudioStatus) => {
        if (!status.isLoaded) return;

        setState(prev => ({
          ...prev,
          currentTime: status.currentTime,
          duration: status.duration,
          isPlaying: status.playing,
        }));

        if (status.didJustFinish && !status.loop) {
          setState(prev => ({ ...prev, isPlaying: false }));
        }
      });

      player.loop = true;
      player.volume = state.volume;

      playerRef.current = player;
      return player;
    } catch (error) {
      logger.error('Failed to load audio', { error });
      return null;
    }
  }, [state.volume]);

  const play = useCallback(async (src: string) => {
    try {
      let player = playerRef.current;

      if (!player) {
        player = await loadAudio(src);
        if (!player) return false;
      }

      player.play();
      setState(prev => ({ ...prev, isPlaying: true }));
      return true;
    } catch (error) {
      logger.error('Failed to play audio', { error });
      setState(prev => ({ ...prev, isPlaying: false }));
      return false;
    }
  }, [loadAudio]);

  const pause = useCallback(() => {
    try {
      if (playerRef.current) {
        playerRef.current.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    } catch (error) {
      logger.error('Failed to pause audio', { error });
    }
  }, []);

  const toggle = useCallback(async (src: string) => {
    if (state.isPlaying) {
      pause();
      return false;
    } else {
      return await play(src);
    }
  }, [state.isPlaying, pause, play]);

  const stop = useCallback(() => {
    try {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      }
    } catch (error) {
      logger.error('Failed to stop audio', { error });
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (playerRef.current) {
      playerRef.current.volume = clampedVolume;
    }
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
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