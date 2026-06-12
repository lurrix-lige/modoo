import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaContainer, WhiteNoisePlayer, BreathingBalloon } from '../../../components';
import { Leaf, Wind, AlertCircle, Cloud, PlayCircle } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  sharedStyles,
  responsive,
  iconSizes,
} from '../../../theme';
import { ChildrenStackParamList } from '../../../navigation/types';
import { apiService, BreathingExercise } from '../../../services';
import { errorHandler } from '../../../services/ErrorHandler';
import { useError } from '../../../contexts/ErrorContext';

type BreathingScreenNavigationProp = NativeStackNavigationProp<ChildrenStackParamList>;

export default function BreathingScreen() {
  const navigation = useNavigation<BreathingScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { addError } = useError();

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exercises, setExercises] = useState<BreathingExercise[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const breathingResponse = await apiService.getBreathingExercises();
      // 添加空值检查
      if (breathingResponse && breathingResponse.exercises) {
        setExercises(breathingResponse.exercises);
      } else {
        setExercises([]);
      }
    } catch (error) {
      const errorMessage = errorHandler.getErrorMessage(
        error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        t('breathing.loadError'),
      );
      setLoadError(errorMessage);
      addError({
        id: errorHandler.generateErrorId(),
        code: 'BREATHING_LOAD_ERROR',
        message: errorMessage,
        severity: 'error',
        timestamp: Date.now(),
        duration: 5000,
        onRetry: loadData,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExercisePress = (exercise: BreathingExercise) => {
    setSelectedExercise(exercise.id);
    navigation.navigate('BreathingPractice');
  };

  const getExerciseInfo = (exercise: BreathingExercise) => {
    return {
      name: t(exercise.nameKey),
      desc: t(exercise.descriptionKey),
    };
  };

  const handleRetry = () => {
    loadData();
  };

  const renderSkeleton = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.skeletonBalloon, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonText, { backgroundColor: colors.border }]} />
      </View>

      <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.border }]} />

      <View style={styles.exerciseList}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
            <View style={styles.skeletonInfo}>
              <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonDesc, { backgroundColor: colors.border }]} />
            </View>
            <View style={[styles.skeletonPlay, { backgroundColor: colors.border }]} />
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderErrorState = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
        <AlertCircle size={responsive.moderateScaleForIcon(iconSizes.hero)} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {loadError || t('breathing.loadError')}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRetry}
        >
          <Text style={[styles.retryButtonText, { color: colors.textPrimary }]}>
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderEmptyState = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
        <Cloud
          size={responsive.moderateScaleForIcon(iconSizes.hero)}
          color={colors.textSecondary}
        />
        <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
          {t('breathing.emptyState')}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('breathing.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('breathing.subtitle')}
        </Text>
      </View>

      {isLoading ? (
        renderSkeleton()
      ) : loadError ? (
        renderErrorState()
      ) : exercises.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
            <BreathingBalloon isActive={false} scale={1} />
            <Text style={[styles.previewText, { color: colors.textPrimary }]}>
              {t('breathing.tapToStart')}
            </Text>
          </View>

          {exercises.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('breathing.exercises')}
              </Text>

              <View style={styles.exerciseList}>
                {exercises.map((exercise) => {
                  const exerciseInfo = getExerciseInfo(exercise);
                  return (
                    <TouchableOpacity
                      key={exercise.id}
                      style={[
                        styles.exerciseCard,
                        {
                          backgroundColor:
                            selectedExercise === exercise.id ? colors.primary : colors.surface,
                        },
                      ]}
                      onPress={() => handleExercisePress(exercise)}
                    >
                      <View
                        style={[
                          styles.exerciseIcon,
                          {
                            backgroundColor:
                              selectedExercise === exercise.id
                                ? colors.textPrimary
                                : colors.primary,
                          },
                        ]}
                      >
                        <Leaf
                          size={responsive.moderateScaleForIcon(iconSizes.lg)}
                          color={
                            selectedExercise === exercise.id ? colors.primary : colors.textPrimary
                          }
                        />
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                          {exerciseInfo.name}
                        </Text>
                        <Text style={[styles.exerciseDesc, { color: colors.textSecondary }]}>
                          {exerciseInfo.desc}
                        </Text>
                      </View>
                      <PlayCircle
                        size={responsive.moderateScaleForIcon(iconSizes.xl)}
                        color={
                          selectedExercise === exercise.id ? colors.textPrimary : colors.primary
                        }
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <WhiteNoisePlayer
            platform="child"
            allowMultiple={false}
            showVolumeControl={true}
            showSleepTimer={true}
            sectionTitle={t('breathing.whiteNoise')}
          />
        </ScrollView>
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    padding: spacing.xxl,
    ...shadows.medium,
  },
  emptyText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    padding: spacing.xxl,
    ...shadows.medium,
  },
  errorText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  exerciseCard: {
    ...sharedStyles.rowStart,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  exerciseDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  exerciseIcon: {
    borderRadius: responsive.moderateScale(24),
    height: responsive.moderateScale(48),
    width: responsive.moderateScale(48),
    ...sharedStyles.columnCenter,
    marginRight: spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  exerciseName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  previewCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    padding: spacing.xxl,
    ...shadows.medium,
  },

  previewText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginTop: spacing.lg,
  },
  retryButton: {
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },

  skeletonBalloon: {
    borderRadius: responsive.moderateScale(60),
    height: responsive.moderateScale(120),
    width: responsive.moderateScale(120),
  },
  skeletonCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.lg,
  },

  skeletonDesc: {
    borderRadius: responsive.moderateScale(6),
    height: responsive.verticalScale(12),
    width: responsive.moderateScale(180),
  },
  skeletonIcon: {
    borderRadius: responsive.moderateScale(24),
    height: responsive.moderateScale(48),
    marginRight: spacing.md,
    width: responsive.moderateScale(48),
  },
  skeletonInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonName: {
    borderRadius: responsive.moderateScale(8),
    height: responsive.verticalScale(16),
    width: responsive.moderateScale(120),
  },
  skeletonPlay: {
    borderRadius: responsive.moderateScale(16),
    height: responsive.moderateScale(32),
    width: responsive.moderateScale(32),
  },
  skeletonSectionTitle: {
    borderRadius: responsive.moderateScale(10),
    height: responsive.verticalScale(20),
    marginBottom: spacing.md,
    width: responsive.moderateScale(100),
  },
  skeletonText: {
    borderRadius: responsive.moderateScale(8),
    height: responsive.verticalScale(16),
    marginTop: spacing.lg,
    width: responsive.moderateScale(150),
  },
  subtitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginTop: spacing.xs,
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
});
