import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { AlertCircle, Wind, Music } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors } from '../../../theme';
import { BreathingBalloon, WhiteNoisePlayer } from '../../../components';
import { ParentStackParamList } from '../../../navigation/types';
import { errorHandler } from '../../../services/ErrorHandler';
import { useError } from '../../../contexts/ErrorContext';

type RelaxSpaceNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

export default function RelaxSpaceScreen() {
  const navigation = useNavigation<RelaxSpaceNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { addError } = useError();

  const [loadError, setLoadError] = useState<string | null>(null);

  const handleWhiteNoiseError = (error: string) => {
    addError({
      id: errorHandler.generateErrorId(),
      code: 'RELAXSPACE_LOAD_ERROR',
      message: error,
      severity: 'error',
      timestamp: Date.now(),
      duration: 5000,
    });
    setLoadError(error);
  };

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

  const getExerciseInfo = (exercise: (typeof breathingExercises)[0]) => {
    return {
      name: t(exercise.nameKey),
      desc: t(exercise.descriptionKey),
    };
  };

  if (loadError) {
    return (
      <SafeAreaContainer style={{ backgroundColor: colors.background }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('relaxSpace.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('relaxSpace.subtitle')}
          </Text>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
            <AlertCircle size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.textPrimary }]}>
              {loadError || t('relaxSpace.loadError')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('relaxSpace.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('relaxSpace.subtitle')}
        </Text>
      </View>

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
          {breathingExercises.map((exercise) => {
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

        <WhiteNoisePlayer
          platform="parent"
          allowMultiple={true}
          showVolumeControl={true}
          showSleepTimer={true}
          sectionTitle={t('relaxSpace.whiteNoise')}
          onError={handleWhiteNoiseError}
        />

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
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  errorCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    padding: spacing.xxl,
    ...shadows.medium,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  exerciseCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    padding: spacing.lg,
    ...shadows.small,
  },
  exerciseDesc: {
    fontSize: typography.fontSize.sm,
  },
  exerciseIcon: {
    alignItems: 'center',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 52,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  exerciseName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  exerciseTiming: {
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    padding: spacing.xxl,
    ...shadows.medium,
  },
  heroText: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  musicButton: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  musicButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  musicDesc: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.md,
  },
  musicHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  musicPreview: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    height: 60,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  musicSection: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xxl,
    padding: spacing.xl,
    ...shadows.medium,
  },
  musicTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.md,
  },
  musicWave: {
    borderRadius: 3,
    height: 40,
    width: 6,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },

  timingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
});
