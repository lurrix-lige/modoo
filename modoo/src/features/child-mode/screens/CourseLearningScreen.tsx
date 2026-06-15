import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaContainer, PermissionGate, ErrorToast } from '../../../components';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music,
  ArrowLeft,
  Sun,
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonColors,
  sharedStyles,
  responsive,
} from '../../../theme';
import { ChildrenStackParamList } from '../../../navigation/types';
import { useCourseAudio, CourseAudioTrack } from '../../../providers/CourseAudioProvider';
import { Lesson } from '../../../services';
import { courseApi } from '../../../infrastructure/api';
import { storageService } from '../../../infrastructure/storage';
import { logger } from '../../../utils/logger';

type CourseLearningRouteProp = RouteProp<ChildrenStackParamList, 'CourseLearning'>;
type CourseLearningNavigationProp = NativeStackNavigationProp<
  ChildrenStackParamList,
  'CourseLearning'
>;

export default function CourseLearningScreen() {
  const navigation = useNavigation<CourseLearningNavigationProp>();
  const route = useRoute<CourseLearningRouteProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
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
  } = useCourseAudio();

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isTrackLoaded, setIsTrackLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasCompletedRef = useRef(false);

  // --- D1: Background volume slider ---
  const bgVolumeValRef = useRef(backgroundVolume);
  const bgVolumeAnim = useRef(new Animated.Value(backgroundVolume)).current;
  const bgBarWidthRef = useRef(0);
  const [bgBarWidth, setBgBarWidth] = useState(0);
  const setBgVolumeRef = useRef(setBackgroundVolume);
  setBgVolumeRef.current = setBackgroundVolume;

  const bgPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gs: { dx: number; dy: number }) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 5,
      onPanResponderGrant: (evt) => {
        const w = bgBarWidthRef.current;
        if (w <= 0) return;
        const newVol = Math.max(0, Math.min(1, evt.nativeEvent.locationX / w));
        bgVolumeValRef.current = newVol;
        bgVolumeAnim.setValue(newVol);
      },
      onPanResponderMove: (evt) => {
        const w = bgBarWidthRef.current;
        if (w <= 0) return;
        const newVol = Math.max(0, Math.min(1, evt.nativeEvent.locationX / w));
        bgVolumeValRef.current = newVol;
        bgVolumeAnim.setValue(newVol);
      },
      onPanResponderRelease: () => {
        setBgVolumeRef.current(bgVolumeValRef.current);
      },
      onPanResponderTerminate: () => {
        setBgVolumeRef.current(bgVolumeValRef.current);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const handleBgBarLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    bgBarWidthRef.current = w;
    setBgBarWidth(w);
  }, []);

  // --- D1: Voice volume slider ---
  const voiceVolumeValRef = useRef(voiceVolume);
  const voiceVolumeAnim = useRef(new Animated.Value(voiceVolume)).current;
  const voiceBarWidthRef = useRef(0);
  const [voiceBarWidth, setVoiceBarWidth] = useState(0);
  const setVoiceVolumeRef = useRef(setVoiceVolume);
  setVoiceVolumeRef.current = setVoiceVolume;

  const voicePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gs: { dx: number; dy: number }) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 5,
      onPanResponderGrant: (evt) => {
        const w = voiceBarWidthRef.current;
        if (w <= 0) return;
        const newVol = Math.max(0, Math.min(1, evt.nativeEvent.locationX / w));
        voiceVolumeValRef.current = newVol;
        voiceVolumeAnim.setValue(newVol);
      },
      onPanResponderMove: (evt) => {
        const w = voiceBarWidthRef.current;
        if (w <= 0) return;
        const newVol = Math.max(0, Math.min(1, evt.nativeEvent.locationX / w));
        voiceVolumeValRef.current = newVol;
        voiceVolumeAnim.setValue(newVol);
      },
      onPanResponderRelease: () => {
        setVoiceVolumeRef.current(voiceVolumeValRef.current);
      },
      onPanResponderTerminate: () => {
        setVoiceVolumeRef.current(voiceVolumeValRef.current);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const handleVoiceBarLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    voiceBarWidthRef.current = w;
    setVoiceBarWidth(w);
  }, []);

  // Sync Animated.Values with state when settings load externally
  useEffect(() => {
    bgVolumeAnim.setValue(backgroundVolume);
    bgVolumeValRef.current = backgroundVolume;
  }, [backgroundVolume]);

  useEffect(() => {
    voiceVolumeAnim.setValue(voiceVolume);
    voiceVolumeValRef.current = voiceVolume;
  }, [voiceVolume]);

  // Animated interpolations for slider fills and thumbs
  const bgFillWidth =
    bgBarWidth > 0
      ? bgVolumeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, bgBarWidth],
          extrapolate: 'clamp',
        })
      : 0;
  const bgThumbTranslate =
    bgBarWidth > 0
      ? bgVolumeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.max(0, bgBarWidth - 16)],
          extrapolate: 'clamp',
        })
      : 0;

  const voiceFillWidth =
    voiceBarWidth > 0
      ? voiceVolumeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, voiceBarWidth],
          extrapolate: 'clamp',
        })
      : 0;
  const voiceThumbTranslate =
    voiceBarWidth > 0
      ? voiceVolumeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.max(0, voiceBarWidth - 16)],
          extrapolate: 'clamp',
        })
      : 0;

  // B5: Sequential init — settings must resolve before lesson data triggers audio load
  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await loadLessonData();
    };
    init();

    return () => {
      if (currentLesson && progress > 0) {
        storageService.saveCoursePlaybackProgress(currentLesson.id, progress);
      }
      stop();
    };
  }, []);

  useEffect(() => {
    if (currentLesson && !isTrackLoaded) {
      loadAudioTrack();
    }
  }, [currentLesson]);

  // D6: Auto-save playback progress every 5 seconds during playback
  useEffect(() => {
    if (!isPlaying || !currentLesson) return;
    const interval = setInterval(() => {
      if (progress > 0) {
        storageService.saveCoursePlaybackProgress(currentLesson.id, progress);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, currentLesson?.id, progress]);

  // D7: Auto-complete lesson when playback finishes
  useEffect(() => {
    if (duration > 0 && progress >= duration - 0.5 && currentLesson && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      courseApi.completeLesson(currentLesson.id).catch((err) => {
        logger.error('Failed to complete lesson', { err, lessonId: currentLesson.id });
        hasCompletedRef.current = false;
      });
    }
  }, [progress, duration, currentLesson]);

  const loadSettings = async () => {
    try {
      const savedSettings = await storageService.getCourseVolumeSettings();
      if (savedSettings) {
        setBackgroundVolume(savedSettings.backgroundVolume);
        setVoiceVolume(savedSettings.voiceVolume);
      }
    } catch (error) {
      logger.error('Failed to load course settings', { error });
    }
  };

  const loadLessonData = async () => {
    // D3: Use navigation params when available, fall back to API
    const params = route.params as Record<string, unknown> | undefined;
    const paramLessonId = params?.lessonId as string | undefined;
    const paramCourseId = params?.courseId as string | undefined;
    const paramTitle = params?.lessonTitle as string | undefined;
    const paramDuration = params?.lessonDuration as number | undefined;
    const paramBgUrl = params?.backgroundMusicUrl as string | undefined;
    const paramVoiceUrl = params?.voiceGuideUrl as string | undefined;
    const paramContentUrl = params?.contentUrl as string | undefined;

    if (paramLessonId && paramTitle && paramDuration != null && paramDuration > 0) {
      setCurrentLesson({
        id: paramLessonId,
        courseId: paramCourseId || '',
        order: 0,
        title: paramTitle,
        name: paramTitle,
        duration: paramDuration,
        type: '',
        contentUrl: paramContentUrl || '',
        backgroundMusicUrl: paramBgUrl,
        voiceGuideUrl: paramVoiceUrl,
      });
      return;
    }

    // Fall back to API fetch
    try {
      const lessonId = paramLessonId || '1';
      const courseId = paramCourseId || '1';
      const course = await courseApi.getCourse(courseId);
      const lessons = course.lessons || [];
      const lessonData = lessons.find((l: Lesson) => l.id === lessonId) || lessons[0];
      if (lessonData) {
        setCurrentLesson(lessonData);
      }
    } catch (loadErr) {
      logger.error('Failed to load lesson', { error: loadErr });
      setLoadError(t('common.loadFailed'));
    }
  };

  const loadAudioTrack = async () => {
    if (!currentLesson) return;

    // B6: Don't fall back both URLs to contentUrl — voiceGuideUrl falls back, backgroundMusicUrl only uses its dedicated URL
    const track: CourseAudioTrack = {
      id: currentLesson.id,
      backgroundMusicUrl: currentLesson.backgroundMusicUrl || '',
      voiceGuideUrl: currentLesson.voiceGuideUrl || currentLesson.contentUrl || '',
      title: currentLesson.name || currentLesson.title,
      duration: currentLesson.duration,
    };

    const success = await play(track);
    if (success) {
      setIsTrackLoaded(true);

      // D6: Restore saved playback position
      try {
        const savedProgress = await storageService.getCoursePlaybackProgress(currentLesson.id);
        if (
          savedProgress &&
          typeof savedProgress === 'object' &&
          !Array.isArray(savedProgress) &&
          'progress' in savedProgress
        ) {
          const sp = (savedProgress as { progress: number }).progress;
          if (sp > 0 && sp < (currentLesson.duration || Infinity)) {
            seekTo(sp);
          }
        }
      } catch (e) {
        // Silently ignore restore errors
      }
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
      if (currentLesson && progress > 0) {
        storageService.saveCoursePlaybackProgress(currentLesson.id, progress);
      }
    } else {
      resume();
    }
  };

  const handleSkipBack = () => {
    seekTo(Math.max(0, progress - 10));
  };

  const handleSkipForward = () => {
    seekTo(Math.min(duration, progress + 10));
  };

  const handleBack = () => {
    if (currentLesson && progress > 0) {
      storageService.saveCoursePlaybackProgress(currentLesson.id, progress);
    }
    stop();
    navigation.goBack();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PermissionGate
      requiredLevel={1}
      mode="modal"
      authTitle={t('auth.unlockContent')}
      authMessage={t('auth.loginToExperience')}
    >
      {!currentLesson ? (
        <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t('common.loading')}
            </Text>
            <View style={styles.headerRight}>
              <Sun size={24} color={colors.textPrimary} />
            </View>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('common.loading')}
            </Text>
          </View>
        </SafeAreaContainer>
      ) : (
        <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {currentLesson.name || currentLesson.title}
            </Text>
            <View style={styles.headerRight}>
              <Sun size={24} color={colors.textPrimary} />
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.visualGuideContainer}>
              <View style={[styles.visualGuide, { backgroundColor: colors.primary }]}>
                <View style={styles.breatheCircle}>
                  <Text style={[styles.breatheText, { color: commonColors.white }]}>
                    {isPlaying ? t('course.breatheIn') : t('course.getReady')}
                  </Text>
                </View>
              </View>
            </View>

            {/* D2: Added backgroundColor to progress bar container */}
            <View style={[styles.progressSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.progressLabel, { color: colors.textPrimary }]}>
                {formatTime(progress)} / {formatTime(duration)}
              </Text>
              <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.controlsSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('course.controls')}
              </Text>
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background }]}
                  onPress={handleSkipBack}
                >
                  <SkipBack size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: colors.primary }]}
                  onPress={handlePlayPause}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text
                      style={{
                        color: commonColors.white,
                        fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
                      }}
                    >
                      ...
                    </Text>
                  ) : isPlaying ? (
                    <Pause size={32} color={commonColors.white} />
                  ) : (
                    <Play size={32} color={commonColors.white} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: colors.background }]}
                  onPress={handleSkipForward}
                >
                  <SkipForward size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* D1+D2: Volume controls with drag sliders and bar backgrounds */}
            <View style={[styles.volumeSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('course.volumeSettings')}
              </Text>

              {/* Background music volume slider */}
              <View style={styles.volumeRow}>
                <View
                  style={[styles.volumeIconContainer, { backgroundColor: colors.primaryLight }]}
                >
                  <Music size={20} color={colors.primary} />
                </View>
                <Text style={[styles.volumeLabel, { color: colors.textSecondary }]}>
                  {t('course.backgroundMusic')}
                </Text>
                <View
                  style={[styles.sliderTrack, { backgroundColor: colors.border }]}
                  onLayout={handleBgBarLayout}
                  {...bgPanResponder.panHandlers}
                >
                  <Animated.View
                    style={[
                      styles.sliderFill,
                      { backgroundColor: colors.primary, width: bgFillWidth },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.sliderThumb,
                      {
                        backgroundColor: colors.primary,
                        transform: [{ translateX: bgThumbTranslate }],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.volumeValue, { color: colors.textSecondary }]}>
                  {Math.round(backgroundVolume * 100)}%
                </Text>
              </View>

              {/* Voice guide volume slider */}
              <View style={styles.volumeRow}>
                <View
                  style={[styles.volumeIconContainer, { backgroundColor: colors.primaryLight }]}
                >
                  <Volume2 size={20} color={colors.primary} />
                </View>
                <Text style={[styles.volumeLabel, { color: colors.textSecondary }]}>
                  {t('course.voiceGuide')}
                </Text>
                <View
                  style={[styles.sliderTrack, { backgroundColor: colors.border }]}
                  onLayout={handleVoiceBarLayout}
                  {...voicePanResponder.panHandlers}
                >
                  <Animated.View
                    style={[
                      styles.sliderFill,
                      { backgroundColor: colors.primary, width: voiceFillWidth },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.sliderThumb,
                      {
                        backgroundColor: colors.primary,
                        transform: [{ translateX: voiceThumbTranslate }],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.volumeValue, { color: colors.textSecondary }]}>
                  {Math.round(voiceVolume * 100)}%
                </Text>
              </View>
            </View>

            {error && (
              <View style={[styles.errorMessage, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <View style={[styles.guideSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('course.guide')}
              </Text>
              <Text style={[styles.guideText, { color: colors.textSecondary }]}>
                {currentLesson.description || t('course.followGuide')}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaContainer>
      )}
      <ErrorToast
        visible={!!loadError}
        message={loadError || ''}
        onDismiss={() => setLoadError(null)}
      />
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: spacing.sm,
  },
  breatheCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 90,
    height: 180,
    justifyContent: 'center',
    width: 180,
  },
  breatheText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  controlButton: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
    ...shadows.small,
  },
  controlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  controlsSection: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    ...shadows.small,
  },
  errorMessage: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
  },
  guideSection: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    ...shadows.small,
  },
  guideText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 1.6,
  },
  header: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerRight: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
  },
  playButton: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
    ...shadows.medium,
  },
  progressBar: {
    borderRadius: 3,
    height: '100%',
  },
  progressBarContainer: {
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressSection: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  sliderFill: {
    borderRadius: 3,
    height: 6,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  sliderThumb: {
    borderRadius: 8,
    height: 16,
    left: 0,
    position: 'absolute',
    top: -5,
    width: 16,
  },
  sliderTrack: {
    borderRadius: 3,
    flex: 1,
    height: 6,
    justifyContent: 'center',
    position: 'relative',
  },
  visualGuide: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    height: 250,
    justifyContent: 'center',
    ...shadows.medium,
  },
  visualGuideContainer: {
    marginBottom: spacing.xl,
  },
  volumeIconContainer: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  volumeLabel: {
    fontSize: typography.fontSize.sm,
    width: 100,
  },
  volumeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  volumeSection: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    ...shadows.small,
  },
  volumeValue: {
    fontSize: typography.fontSize.sm,
    fontVariant: ['tabular-nums'],
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'right',
    width: 40,
  },
});
