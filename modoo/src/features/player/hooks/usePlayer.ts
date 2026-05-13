import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../../utils/logger';
import { apiService } from '../../../services';
import { usePlayerStore } from '../../../store';
import { useAudio } from '../../../providers/AudioProvider';
import { Story } from '../../../types';

export interface UsePlayerReturn {
  isPlaying: boolean;
  isBuffering: boolean;
  progress: number;
  duration: number;
  isLoading: boolean;
  story: (Story & { isFavorite?: boolean }) | null;
  savedProgress: number | null;
  error: string | null;
  play: (url: string) => Promise<boolean>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (value: number) => Promise<void>;
  skipForward: (seconds: number) => void;
  skipBackward: (seconds: number) => void;
  saveProgress: () => void;
  toggleFavorite: () => void;
  clearError: () => void;
}

export function usePlayer(storyId: string | undefined): UsePlayerReturn {
  const [story, setStory] = useState<(Story & { isFavorite?: boolean }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedProgress, setSavedProgress] = useState<number | null>(null);
  const [lastProgressSave, setLastProgressSave] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    currentStory,
    play: storePlay,
    stop: storeStop,
    updateProgress,
    toggleFavorite,
  } = usePlayerStore();

  const audioContext = useAudio();
  const {
    isPlaying,
    progress: audioProgress,
    duration: audioDuration,
    isBuffering: audioBuffering,
    play: audioPlay,
    pause: audioPause,
    resume: audioResume,
    stop: audioStop,
    seekTo: audioSeekTo,
    error: audioError,
  } = audioContext;

  useEffect(() => {
    logger.debug('useAudio context acquired', { 
      isPlaying, 
      progress: audioProgress, 
      duration: audioDuration,
      audioContextExists: !!audioContext 
    });
  }, []);

  useEffect(() => {
    updateProgress(audioProgress, audioDuration);
  }, [audioProgress, audioDuration, updateProgress]);

  useEffect(() => {
    if (audioError) {
      setError(audioError);
    }
  }, [audioError]);

  useEffect(() => {
    if (story && isPlaying && audioProgress > 0 && Date.now() - lastProgressSave > 10000) {
      saveProgress();
    }
  }, [audioProgress, isPlaying, story, lastProgressSave]);

  useEffect(() => {
    const loadStory = async () => {
      setIsLoading(true);
      try {
        let storyData;

        if (storyId) {
          try {
            logger.debug('Loading story with ID', { storyId });
            storyData = await apiService.getStory(storyId);
          } catch (err) {
            logger.error('Failed to load single story, falling back to list', { err });
            const storiesResponse = await apiService.getStories();
            storyData = storiesResponse.stories?.[0];
          }
        } else {
          logger.debug('No story ID provided, loading first story');
          const storiesResponse = await apiService.getStories();
          storyData = storiesResponse.stories?.[0];
        }

        if (storyData) {
          setStory(storyData);
          if (storyData.progress && storyData.progress > 0) {
            setSavedProgress(storyData.progress);
          }
        } else {
          logger.error('No story data found');
        }
      } catch (error) {
        logger.error('Failed to load story', { error });
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId]);

  const seekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    logger.debug('Auto-play useEffect triggered', { 
      storyExists: !!story, 
      audioUrlExists: !!story?.audioUrl,
      audioUrl: story?.audioUrl 
    });

    if (!story) {
      logger.debug('Story not loaded yet, skipping auto-play');
      return;
    }

    if (!story.audioUrl) {
      logger.error('Story has no audio URL', { storyId: story.id, title: story.title });
      return;
    }

    const startPlay = async () => {
      try {
        logger.info('Auto-playing story', {
          title: story.title,
          audioUrl: story.audioUrl,
        });
        storePlay(story);

        logger.debug('Calling audioPlay with URL', { url: story.audioUrl });
        const success = await audioPlay(story.audioUrl);
        logger.info('Auto-play result', { success, title: story.title });

        if (!success) {
          logger.error('Auto-play returned false', { title: story.title, audioUrl: story.audioUrl });
          setError('Failed to start audio playback');
          return;
        }

        if (savedProgress && savedProgress > 0) {
          seekTimerRef.current = setTimeout(() => {
            audioSeekTo(savedProgress);
            logger.debug('Seeked to saved progress', { savedProgress });
          }, 500);
        }
      } catch (error) {
        logger.error('Failed to start auto-play', { error, title: story.title });
        setError('Failed to start audio playback');
      }
    };

    startPlay();

    return () => {
      if (seekTimerRef.current) {
        clearTimeout(seekTimerRef.current);
        seekTimerRef.current = null;
      }
      if (story && audioProgress > 0) {
        saveProgress();
      }
      audioStop();
      storeStop();
    };
  }, [story]);

  const saveProgress = useCallback(async () => {
    if (!story) return;

    try {
      setLastProgressSave(Date.now());
      const progress = Math.floor(audioProgress);
      const duration = Math.floor(audioDuration || story.duration || 0);
      const completed = duration > 0 && progress / duration >= 0.95;

      await apiService.updateStoryProgress(story.id, progress, completed);
      logger.debug('Play progress saved', { progress, completed });
    } catch (error) {
      logger.error('Failed to save progress', { error });
    }
  }, [story, audioProgress, audioDuration]);

  const skipForward = useCallback(
    (seconds: number) => {
      const newPosition = Math.min(audioDuration || 0, audioProgress + seconds);
      audioSeekTo(newPosition);
    },
    [audioProgress, audioDuration, audioSeekTo]
  );

  const skipBackward = useCallback(
    (seconds: number) => {
      const newPosition = Math.max(0, audioProgress - seconds);
      audioSeekTo(newPosition);
    },
    [audioProgress, audioSeekTo]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isPlaying,
    isBuffering: audioBuffering,
    progress: audioProgress,
    duration: audioDuration,
    isLoading,
    story,
    savedProgress,
    error,
    play: audioPlay,
    pause: audioPause,
    resume: audioResume,
    stop: audioStop,
    seekTo: audioSeekTo,
    skipForward,
    skipBackward,
    saveProgress,
    toggleFavorite,
    clearError,
  };
}