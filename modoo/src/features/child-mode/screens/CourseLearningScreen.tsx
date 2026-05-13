import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors } from '../../../theme';
import { ChildrenStackParamList } from '../../../navigation/types';
import { useCourseAudio, CourseAudioTrack } from '../../../providers/CourseAudioProvider';
import { apiService, Lesson } from '../../../services';
import { logger } from '../../../utils/logger';

type CourseLearningRouteProp = RouteProp<ChildrenStackParamList, 'CourseLearning'>;
type CourseLearningNavigationProp = NativeStackNavigationProp<ChildrenStackParamList, 'CourseLearning'>;

export default function CourseLearningScreen() {
  const navigation = useNavigation<CourseLearningNavigationProp>();
  const route = useRoute<CourseLearningRouteProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
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

  useEffect(() => {
    loadLessonData();
  }, []);

  useEffect(() => {
    if (currentLesson && !isTrackLoaded) {
      loadAudioTrack();
    }
  }, [currentLesson]);

  const loadLessonData = async () => {
    try {
      const lessonId = (route.params as { lessonId?: string })?.lessonId || '1';
      const course = await apiService.getCourse('1');
      const lessons = course.lessons || [];
      const lessonData = lessons.find((l: Lesson) => l.id === lessonId) || lessons[0];
      setCurrentLesson(lessonData);
    } catch (error) {
      logger.error('Failed to load lesson', { error });
      Alert.alert(t('common.error'), t('course.loadFailed'));
    }
  };

  const loadAudioTrack = async () => {
    if (!currentLesson) return;

    const track: CourseAudioTrack = {
      id: currentLesson.id,
      backgroundMusicUrl: currentLesson.backgroundMusicUrl || currentLesson.contentUrl || '',
      voiceGuideUrl: currentLesson.voiceGuideUrl || currentLesson.contentUrl || '',
      title: currentLesson.name || currentLesson.title,
      duration: currentLesson.duration,
    };

    const success = await play(track);
    if (success) {
      setIsTrackLoaded(true);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSkipBack = () => {
    const newPosition = Math.max(0, progress - 10);
    seekTo(newPosition);
  };

  const handleSkipForward = () => {
    const newPosition = Math.min(duration, progress + 10);
    seekTo(newPosition);
  };

  const handleBack = () => {
    stop();
    navigation.goBack();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentLesson) {
    return (
      <SafeAreaContainer style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={[styles.backText, { color: colors.textPrimary }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {currentLesson.name || currentLesson.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.visualGuide, { backgroundColor: colors.primary }]}>
          <View style={styles.breatheCircle}>
            <Text style={[styles.breatheText, { color: commonColors.white }]}>
              {isPlaying ? t('course.breatheIn') : t('course.getReady')}
            </Text>
          </View>
        </View>

        <View style={[styles.progressSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.progressLabel, { color: colors.textPrimary }]}>
            {formatTime(progress)} / {formatTime(duration)}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${duration > 0 ? (progress / duration) * 100 : 0}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={styles.controlsSection}>
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.surface }]} onPress={handleSkipBack}>
            <SkipBack size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.playButton, { backgroundColor: colors.primary }]} 
            onPress={handlePlayPause}
            disabled={isLoading}
          >
            {isPlaying ? (
              <Pause size={32} color={commonColors.white} />
            ) : (
              <Play size={32} color={commonColors.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.surface }]} onPress={handleSkipForward}>
            <SkipForward size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.volumeSection, { backgroundColor: colors.surface }]}>
          <View style={styles.volumeRow}>
            <View style={[styles.volumeIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Music size={20} color={colors.primary} />
            </View>
            <Text style={[styles.volumeLabel, { color: colors.textSecondary }]}>{t('course.backgroundMusic')}</Text>
            <View style={styles.volumeBarContainer}>
              <View 
                style={[styles.volumeBar, { width: `${backgroundVolume * 100}%`, backgroundColor: colors.primary }]} 
              />
            </View>
            <Text style={[styles.volumeValue, { color: colors.textSecondary }]}>
              {Math.round(backgroundVolume * 100)}%
            </Text>
            <TouchableOpacity onPress={() => setBackgroundVolume(backgroundVolume + 0.1)}>
              <Volume2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.volumeRow}>
            <View style={[styles.volumeIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Volume2 size={20} color={colors.primary} />
            </View>
            <Text style={[styles.volumeLabel, { color: colors.textSecondary }]}>{t('course.voiceGuide')}</Text>
            <View style={styles.volumeBarContainer}>
              <View 
                style={[styles.volumeBar, { width: `${voiceVolume * 100}%`, backgroundColor: colors.primary }]} 
              />
            </View>
            <Text style={[styles.volumeValue, { color: colors.textSecondary }]}>
              {Math.round(voiceVolume * 100)}%
            </Text>
            <TouchableOpacity onPress={() => setVoiceVolume(voiceVolume + 0.1)}>
              <Volume2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <View style={[styles.errorMessage, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.guideSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('course.guide')}</Text>
          <Text style={[styles.guideText, { color: colors.textSecondary }]}>
            {currentLesson.description || t('course.followGuide')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  visualGuide: {
    height: 300,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  breatheCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breatheText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  progressSection: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  progressLabel: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  volumeSection: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  volumeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeLabel: {
    fontSize: typography.fontSize.sm,
    width: 100,
  },
  volumeBarContainer: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  volumeBar: {
    height: '100%',
    borderRadius: 3,
  },
  volumeValue: {
    fontSize: typography.fontSize.sm,
    width: 40,
    textAlign: 'right',
  },
  errorMessage: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
  },
  guideSection: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  guideText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 1.6,
  },
});
