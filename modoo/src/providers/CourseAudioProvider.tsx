import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { validateUrl } from './AudioCore';
import { audioFocusManager, FocusAction } from './AudioFocusManager';
import { useUnifiedAudio } from './UnifiedAudioProvider';
import { logger } from '../utils/logger';

export interface CourseAudioTrack {
  id: string;
  backgroundMusicUrl: string;
  voiceGuideUrl: string;
  title?: string;
  duration?: number;
}

interface CourseAudioContextType {
  isPlaying: boolean;
  progress: number;
  duration: number;
  isBuffering: boolean;
  isLoading: boolean;
  error: string | null;
  backgroundVolume: number;
  voiceVolume: number;
  play: (track: CourseAudioTrack) => Promise<boolean>;
  pause: () => void;
  resume: () => Promise<boolean>;
  stop: () => void;
  seekTo: (position: number) => Promise<void>;
  setBackgroundVolume: (volume: number) => void;
  setVoiceVolume: (volume: number) => void;
}

const CourseAudioContext = createContext<CourseAudioContextType | undefined>(undefined);

export function CourseAudioProvider({ children }: { children: React.ReactNode }) {
  const unifiedAudio = useUnifiedAudio();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundVolume, setBackgroundVolumeState] = useState(0.5);
  const [voiceVolume, setVoiceVolumeState] = useState(0.75);
  const currentTrackRef = useRef<CourseAudioTrack | null>(null);

  const play = useCallback(async (track: CourseAudioTrack): Promise<boolean> => {
    logger.debug('CourseAudioProvider.play called with track', { track });

    if (currentTrackRef.current?.id === track.id && unifiedAudio.isPlaying) {
      logger.debug('Same track already playing');
      return true;
    }

    setIsLoading(true);
    setError(null);
    currentTrackRef.current = track;

    const tracks: Array<{ id: string; url: string; volume: number; loop: boolean; role: 'main' | 'background' }> = [];

    if (track.backgroundMusicUrl) {
      const bgValidation = validateUrl(track.backgroundMusicUrl);
      if (bgValidation.valid) {
        tracks.push({
          id: 'background',
          url: track.backgroundMusicUrl,
          volume: backgroundVolume,
          loop: true,
          role: 'background',
        });
      }
    }

    if (track.voiceGuideUrl) {
      const voiceValidation = validateUrl(track.voiceGuideUrl);
      if (voiceValidation.valid) {
        tracks.push({
          id: 'voice',
          url: track.voiceGuideUrl,
          volume: voiceVolume,
          loop: false,
          role: 'main',
        });
      }
    }

    if (tracks.length === 0) {
      setError('No valid audio URLs provided');
      setIsLoading(false);
      return false;
    }

    try {
      const success = await unifiedAudio.play({ tracks });

      if (success) {
        audioFocusManager.request('course', 'main', (action: FocusAction) => {
          if (action === 'stop') {
            unifiedAudio.stop();
            audioFocusManager.release('course');
            setError(null);
          }
        });
        setIsLoading(false);
        return true;
      } else {
        setError('Failed to play course audio');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      logger.error('Failed to play course audio', { err });
      setError('Playback failed');
      setIsLoading(false);
      return false;
    }
  }, [unifiedAudio, backgroundVolume, voiceVolume]);

  const pause = useCallback(() => {
    unifiedAudio.pause();
  }, [unifiedAudio]);

  const resume = useCallback(async (): Promise<boolean> => {
    logger.debug('CourseAudioProvider.resume called');

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
    audioFocusManager.release('course');
    unifiedAudio.stop();
    currentTrackRef.current = null;
    setError(null);
  }, [unifiedAudio]);

  const seekTo = useCallback(async (position: number) => {
    logger.debug('CourseAudioProvider.seekTo called with position', { position });
    await unifiedAudio.seekTo(position);
  }, [unifiedAudio]);

  const setBackgroundVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setBackgroundVolumeState(clampedVolume);
    unifiedAudio.setVolume('background', clampedVolume);
  }, [unifiedAudio]);

  const setVoiceVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setVoiceVolumeState(clampedVolume);
    unifiedAudio.setVolume('voice', clampedVolume);
  }, [unifiedAudio]);

  return (
    <CourseAudioContext.Provider
      value={{
        isPlaying: unifiedAudio.isPlaying,
        progress: unifiedAudio.progress,
        duration: unifiedAudio.duration,
        isBuffering: unifiedAudio.isBuffering,
        isLoading,
        error,
        backgroundVolume,
        voiceVolume,
        play,
        pause,
        resume,
        stop,
        seekTo,
        setBackgroundVolume,
        setVoiceVolume,
      }}
    >
      {children}
    </CourseAudioContext.Provider>
  );
}

export function useCourseAudio() {
  const context = useContext(CourseAudioContext);
  if (context === undefined) {
    throw new Error('useCourseAudio must be used within a CourseAudioProvider');
  }
  return context;
}
