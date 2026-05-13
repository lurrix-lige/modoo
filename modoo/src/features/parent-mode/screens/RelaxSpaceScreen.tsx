import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { AlertCircle, Wind, Pause, Music, CloudRain, Waves, Flame, TreeDeciduous, Bird, Coffee } from 'lucide-react-native';

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'cloud-rain': CloudRain,
  'waves': Waves,
  'flame': Flame,
  'tree-deciduous': TreeDeciduous,
  'birds': Bird,
  'coffee': Coffee,
};
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, sharedStyles, commonColors } from '../../../theme';
import { BreathingBalloon } from '../../../components';
import { ParentStackParamList } from '../../../navigation/types';
import { apiService, WhiteNoise } from '../../../services';
import { errorHandler } from '../../../services/ErrorHandler';
import { useError } from '../../../contexts/ErrorContext';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';

type RelaxSpaceNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

export default function RelaxSpaceScreen() {
  const navigation = useNavigation<RelaxSpaceNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { addError } = useError();
  const { isPlaying, toggle, stop } = useAudioPlayer();

  const [selectedWhiteNoise, setSelectedWhiteNoise] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [whiteNoises, setWhiteNoises] = useState<WhiteNoise[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await apiService.getWhiteNoises();
      setWhiteNoises(response.noises);
    } catch (error) {
      const errorMessage = errorHandler.getErrorMessage(
        error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        t('relaxSpace.loadError')
      );
      setLoadError(errorMessage);
      addError({
        id: errorHandler.generateErrorId(),
        code: 'RELAXSPACE_LOAD_ERROR',
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

  const getWhiteNoiseName = (noise: WhiteNoise) => {
    if (noise.nameKey) {
      return t(noise.nameKey);
    }
    if (noise.name) {
      return noise.name;
    }
    return t(`relaxSpace.${noise.id}`) || noise.id;
  };

  const handleWhiteNoisePress = async (noise: WhiteNoise) => {
    if (selectedWhiteNoise === noise.id) {
      await stop();
      setSelectedWhiteNoise(null);
    } else {
      if (selectedWhiteNoise) {
        await stop();
      }

      const noiseUrl = noise.audioUrl;
      if (noiseUrl) {
        const success = await toggle(noiseUrl);
        if (success) {
          setSelectedWhiteNoise(noise.id);
        } else {
          addError({
            id: errorHandler.generateErrorId(),
            code: 'AUDIO_PLAY_ERROR',
            message: t('relaxSpace.audioPlayError'),
            severity: 'error',
            timestamp: Date.now(),
            duration: 5000,
          });
        }
      }
    }
  };

  const handleRetry = () => {
    loadData();
  };

  useEffect(() => {
    const cleanup = () => {
      stop();
    };
    return cleanup;
  }, [stop]);

  const breathingExercises = [
    {
      id: '478',
      nameKey: 'relaxSpace.breathing.478.name',
      descriptionKey: 'relaxSpace.breathing.478.desc',
      inhale: 4,
      hold: 7,
      exhale: 8,
    },
    {
      id: 'box',
      nameKey: 'relaxSpace.breathing.box.name',
      descriptionKey: 'relaxSpace.breathing.box.desc',
      inhale: 4,
      hold: 4,
      exhale: 4,
    },
    {
      id: 'calm',
      nameKey: 'relaxSpace.breathing.calm.name',
      descriptionKey: 'relaxSpace.breathing.calm.desc',
      inhale: 3,
      hold: 2,
      exhale: 4,
    },
  ];

  const getExerciseInfo = (exercise: typeof breathingExercises[0]) => {
    return {
      name: t(exercise.nameKey),
      desc: t(exercise.descriptionKey),
    };
  };

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('relaxSpace.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('relaxSpace.subtitle')}
        </Text>
      </View>

      {isLoading ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.skeletonCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.skeletonBalloon, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonText, { backgroundColor: colors.border }]} />
          </View>
          <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.border }]} />
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.skeletonExerciseCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
              <View style={styles.skeletonInfo}>
                <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonDesc, { backgroundColor: colors.border }]} />
              </View>
            </View>
          ))}
          <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonNoiseGrid}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={[styles.skeletonNoiseCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.skeletonNoiseIcon, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonNoiseName, { backgroundColor: colors.border }]} />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : loadError ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
            <AlertCircle size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.textPrimary }]}>
              {loadError || t('relaxSpace.loadError')}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleRetry}
            >
              <Text style={[styles.retryButtonText, { color: commonColors.white }]}>
                {t('common.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
            <BreathingBalloon isActive={false} scale={1.2} />
            <Text style={[styles.heroText, { color: colors.textPrimary }]}>
              {t('relaxSpace.heroText')}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('relaxSpace.breathingExercises')}
          </Text>

          <View style={styles.exerciseList}>
            {breathingExercises.map(exercise => {
              const exerciseInfo = getExerciseInfo(exercise);
              return (
                <TouchableOpacity
                  key={exercise.id}
                  style={[styles.exerciseCard, { backgroundColor: colors.surface }]}
                  onPress={() => {}}
                >
                  <View style={[styles.exerciseIcon, { backgroundColor: colors.primary }]}>
                    <Wind size={24} color={commonColors.white} />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>
                      {exerciseInfo.name}
                    </Text>
                    <Text style={[styles.exerciseDesc, { color: colors.textSecondary }]}>
                      {exerciseInfo.desc}
                    </Text>
                  </View>
                  <View style={[styles.exerciseTiming, { backgroundColor: colors.background }]}>
                    <Text style={[styles.timingText, { color: colors.secondary }]}>
                      {exercise.inhale}-{exercise.hold}-{exercise.exhale}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('relaxSpace.whiteNoise')}
          </Text>

          <View style={styles.whiteNoiseGrid}>
            {whiteNoises.map(noise => (
              <TouchableOpacity
                key={noise.id}
                style={[
                  styles.noiseCard,
                  {
                    backgroundColor:
                      selectedWhiteNoise === noise.id ? (noise.color || colors.surface) : colors.surface,
                  },
                ]}
                onPress={() => handleWhiteNoisePress(noise)}
              >
                {/* 直接使用 Music 图标，确保不会渲�?undefined */}
                <Music size={36} color={selectedWhiteNoise === noise.id ? commonColors.white : (noise.color || commonColors.white)} />
                <Text
                  style={[
                    styles.noiseName,
                    { color: selectedWhiteNoise === noise.id ? commonColors.white : colors.textPrimary },
                  ]}
                >
                  {getWhiteNoiseName(noise)}
                </Text>
                {selectedWhiteNoise === noise.id && (
                  <View style={[styles.playingIndicator, { backgroundColor: colors.success }]}>
                    <Pause size={16} color={commonColors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.musicSection, { backgroundColor: colors.surface }]}>
            <View style={styles.musicHeader}>
              <Music size={24} color={colors.primary} />
              <View>
                <Text style={[styles.musicTitle, { color: colors.textPrimary }]}>
                  {t('relaxSpace.sleepMusic')}
                </Text>
                <Text style={[styles.musicDesc, { color: colors.textSecondary }]}>
                  {t('relaxSpace.sleepMusicDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.musicPreview}>
              <View style={[styles.musicWave, { backgroundColor: colors.primary }]} />
              <View style={[styles.musicWave, { backgroundColor: colors.primary }, { height: 20 }]} />
              <View style={[styles.musicWave, { backgroundColor: colors.primary }, { height: 30 }]} />
              <View style={[styles.musicWave, { backgroundColor: colors.primary }, { height: 15 }]} />
              <View style={[styles.musicWave, { backgroundColor: colors.primary }, { height: 25 }]} />
            </View>
            <TouchableOpacity
              style={[styles.musicButton, { backgroundColor: colors.primary }]}
              onPress={() => {}}
            >
              <Text style={[styles.musicButtonText, { color: commonColors.white }]}>
                {t('relaxSpace.exploreMusic')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  heroCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  heroText: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  exerciseList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  exerciseIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  exerciseDesc: {
    fontSize: typography.fontSize.sm,
  },
  exerciseTiming: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  timingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  whiteNoiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  noiseCard: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.small,
    position: 'relative',
  },
  noiseName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
  },
  playingIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicSection: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xxl,
    ...shadows.medium,
  },
  musicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  musicTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.md,
  },
  musicDesc: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.md,
  },
  musicPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 60,
    marginBottom: spacing.lg,
  },
  musicWave: {
    width: 6,
    height: 40,
    borderRadius: 3,
  },
  musicButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  musicButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },

  errorCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },

  skeletonCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  skeletonBalloon: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  skeletonText: {
    width: 180,
    height: 16,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 20,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  skeletonExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  skeletonIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: spacing.md,
  },
  skeletonInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonName: {
    width: 140,
    height: 16,
    borderRadius: 8,
  },
  skeletonDesc: {
    width: 200,
    height: 12,
    borderRadius: 6,
  },
  skeletonNoiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  skeletonNoiseCard: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  skeletonNoiseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  skeletonNoiseName: {
    width: 70,
    height: 14,
    borderRadius: 7,
  },
});