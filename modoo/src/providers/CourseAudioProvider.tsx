import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { UnifiedAudioPlayer, setupAudioMode, validateUrl } from './AudioCore';
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
  const playerRef = useRef<UnifiedAudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundVolume, setBackgroundVolumeState] = useState(0.5);
  const [voiceVolume, setVoiceVolumeState] = useState(1.0);
  const currentTrackRef = useRef<CourseAudioTrack | null>(null);

  useEffect(() => {
    setupAudioMode();
    playerRef.current = new UnifiedAudioPlayer();
    playerRef.current.setProgressUpdateCallback((progressVal, durationVal) => {
      setProgress(progressVal);
      setDuration(durationVal);
    });
    playerRef.current.setCompletionCallback(() => {
      setIsPlaying(false);
    });

    return () => {
      playerRef.current?.unloadAll();
    };
  }, []);

  const play = useCallback(async (track: CourseAudioTrack): Promise<boolean> => {
    logger.debug('CourseAudioProvider.play called with track', { track });

    if (playerRef.current?.isCompletedState() && currentTrackRef.current?.id === track.id) {
      logger.debug('Attempting to replay completed course audio');
      const success = await playerRef.current.replay();
      if (success) {
        setIsPlaying(true);
        setError(null);
        return true;
      }
    }

    setIsLoading(true);
    setError(null);
    currentTrackRef.current = track;

    const bgValidation = validateUrl(track.backgroundMusicUrl);
    const voiceValidation = validateUrl(track.voiceGuideUrl);

    if (!bgValidation.valid || !voiceValidation.valid) {
      const errorMsg = bgValidation.message || voiceValidation.message || 'Invalid audio URL';
      setError(errorMsg);
      setIsLoading(false);
      return false;
    }

    try {
      const success = await playerRef.current?.play({
        tracks: [
          {
            id: 'background',
            url: track.backgroundMusicUrl,
            volume: backgroundVolume,
            loop: true,
            role: 'background',
          },
          {
            id: 'voice',
            url: track.voiceGuideUrl,
            volume: voiceVolume,
            loop: false,
            role: 'main',
          },
        ],
      });

      if (success) {
        setIsPlaying(true);
        setIsLoading(false);
        return true;
      } else {
        setError('Failed to play course audio');
        setIsLoading(false);
        setIsPlaying(false);
        return false;
      }
    } catch (err) {
      logger.error('Failed to play course audio', { err });
      setError('Playback failed');
      setIsLoading(false);
      setIsPlaying(false);
      return false;
    }
  }, [backgroundVolume, voiceVolume]);

  const pause = useCallback(() => {
    playerRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(async (): Promise<boolean> => {
    logger.debug('CourseAudioProvider.resume called');
    
    if (playerRef.current?.isCompletedState()) {
      logger.debug('Resume detected completed state, attempting replay');
      const success = await playerRef.current.replay();
      if (success) {
        setIsPlaying(true);
        return true;
      }
    }
    
    playerRef.current?.resume();
    setIsPlaying(true);
    return true;
  }, []);

  const stop = useCallback(() => {
    playerRef.current?.unloadAll();
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    currentTrackRef.current = null;
  }, []);

  const seekTo = useCallback(async (position: number) => {
    logger.debug('CourseAudioProvider.seekTo called with position', { position });
    await playerRef.current?.seekTo(position);
  }, []);

  const setBackgroundVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setBackgroundVolumeState(clampedVolume);
    playerRef.current?.setVolume('background', clampedVolume);
  }, []);

  const setVoiceVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setVoiceVolumeState(clampedVolume);
    playerRef.current?.setVolume('voice', clampedVolume);
  }, []);

  return (
    <CourseAudioContext.Provider
      value={{
        isPlaying,
        progress,
        duration,
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