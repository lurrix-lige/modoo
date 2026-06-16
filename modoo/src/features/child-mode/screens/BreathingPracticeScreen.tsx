import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { ArrowLeft, Play, Pause, RefreshCw, CheckCircle, Settings } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  commonColors,
  sharedStyles,
  shadows,
} from '../../../theme';
import { BreathingBalloon, ErrorToast } from '../../../components';
import { ChildrenStackParamList } from '../../../navigation/types';
import { logger } from '../../../utils/logger';

type BreathingPracticeNavigationProp = NativeStackNavigationProp<ChildrenStackParamList>;

const BREATHING_PATTERN = {
  '4-4-4-4': [
    { nameKey: 'common.inhale', duration: 4000 },
    { nameKey: 'common.hold', duration: 4000 },
    { nameKey: 'common.exhale', duration: 4000 },
    { nameKey: 'common.hold', duration: 4000 },
  ],
  '4-7-8': [
    { nameKey: 'common.inhale', duration: 4000 },
    { nameKey: 'common.hold', duration: 7000 },
    { nameKey: 'common.exhale', duration: 8000 },
  ],
};

interface PracticeError {
  visible: boolean;
  message: string;
  code?: string;
}

export default function BreathingPracticeScreen() {
  const navigation = useNavigation<BreathingPracticeNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState<'4-4-4-4' | '4-7-8'>('4-4-4-4');
  const [isLoading, setIsLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<PracticeError>({
    visible: false,
    message: '',
  });
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  const phases = BREATHING_PATTERN[selectedPattern];

  const getPhaseName = (patternId: string, index: number) => {
    const phase = BREATHING_PATTERN[patternId as keyof typeof BREATHING_PATTERN][index];
    return t(phase.nameKey);
  };

  useEffect(() => {
    isActiveRef.current = isActive;
    if (isActive) {
      runBreathingCycle();
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      setCurrentPhase(0);
      setTimeLeft(0);
    }

    return () => {
      isActiveRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isActive]);

  const runBreathingCycle = () => {
    let phaseIndex = 0;

    const runPhase = () => {
      if (!isActiveRef.current) return;

      try {
        setCurrentPhase(phaseIndex);
        const phase = phases[phaseIndex];
        setTimeLeft(phase.duration / 1000);

        Animated.timing(progressAnim, {
          toValue: phaseIndex,
          duration: 100,
          useNativeDriver: false,
        }).start();

        let remaining = phase.duration;
        countdownTimerRef.current = setInterval(() => {
          remaining -= 100;
          setTimeLeft(Math.ceil(remaining / 1000));
        }, 100);

        timerRef.current = setTimeout(() => {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          phaseIndex = (phaseIndex + 1) % phases.length;

          if (phaseIndex === 0) {
            setTotalCycles((prev) => prev + 1);
          }

          runPhase();
        }, phase.duration);
      } catch (error) {
        showPracticeError(t('common.error'), 'PRACTICE_ERROR', error);
        setIsActive(false);
      }
    };

    runPhase();
  };

  const showPracticeError = (message: string, code: string, error?: unknown) => {
    logger.error(message, error ? { error } : undefined);
    setPracticeError({
      visible: true,
      message,
      code,
    });
  };

  const handleRetry = () => {
    setPracticeError({ visible: false, message: '' });
  };

  const handleDismissError = () => {
    setPracticeError({ visible: false, message: '' });
  };

  const togglePractice = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      setTotalCycles(0);
    }
  };

  const switchPattern = (pattern: '4-4-4-4' | '4-7-8') => {
    if (isActive) {
      setIsActive(false);
    }
    setSelectedPattern(pattern);
  };

  return (
    <SafeAreaContainer
      style={[sharedStyles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('breathing.exercises')}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.patternSelector}>
            <TouchableOpacity
              style={[
                styles.patternButton,
                {
                  backgroundColor: selectedPattern === '4-4-4-4' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => switchPattern('4-4-4-4')}
            >
              <Text
                style={[
                  styles.patternText,
                  {
                    color: selectedPattern === '4-4-4-4' ? commonColors.white : colors.textPrimary,
                  },
                ]}
              >
                {t('breathing.balanceBreathing')}
              </Text>
              <Text
                style={[
                  styles.patternDesc,
                  {
                    color:
                      selectedPattern === '4-4-4-4' ? commonColors.white : colors.textSecondary,
                  },
                ]}
              >
                4-4-4-4
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.patternButton,
                {
                  backgroundColor: selectedPattern === '4-7-8' ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => switchPattern('4-7-8')}
            >
              <Text
                style={[
                  styles.patternText,
                  { color: selectedPattern === '4-7-8' ? commonColors.white : colors.textPrimary },
                ]}
              >
                {t('breathing.relaxBreathing')}
              </Text>
              <Text
                style={[
                  styles.patternDesc,
                  {
                    color: selectedPattern === '4-7-8' ? commonColors.white : colors.textSecondary,
                  },
                ]}
              >
                4-7-8
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                {t('common.loading')}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.balloonContainer}>
                <BreathingBalloon isActive={isActive} scale={1} />

                <View style={styles.phaseInfo}>
                  {isActive ? (
                    <>
                      <Text style={[styles.phaseText, { color: colors.primary }]}>
                        {getPhaseName(selectedPattern, currentPhase)}
                      </Text>
                      <Text style={[styles.timerText, { color: colors.textPrimary }]}>
                        {timeLeft}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.phaseText, { color: colors.textSecondary }]}>
                      {t('breathing.tapToStart')}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.phasesGuide}>
                {phases.map((phase, index) => (
                  <View key={index} style={styles.phaseGuideItem}>
                    <View
                      style={[
                        styles.phaseDot,
                        {
                          backgroundColor:
                            isActive && currentPhase === index ? colors.primary : colors.border,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.phaseGuideText,
                        {
                          color:
                            isActive && currentPhase === index
                              ? colors.primary
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {getPhaseName(selectedPattern, index)}
                    </Text>
                    <Text style={[styles.phaseDuration, { color: colors.textPlaceholder }]}>
                      {phase.duration / 1000}
                      {t('common.seconds')}
                    </Text>
                  </View>
                ))}
              </View>

              {isActive && totalCycles > 0 && (
                <View style={styles.cycleCounter}>
                  <RefreshCw size={20} color={colors.success} />
                  <Text style={[styles.cycleText, { color: colors.success }]}>
                    {t('common.completed')} {totalCycles}
                    {t('common.cycles')}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.mainButton,
              { backgroundColor: isActive ? colors.error : colors.primary },
            ]}
            onPress={togglePractice}
            disabled={isLoading}
          >
            {isActive ? (
              <Pause size={24} color={colors.textPrimary} />
            ) : (
              <Play size={24} color={colors.textPrimary} />
            )}
            <Text style={[styles.mainButtonText, { color: commonColors.white }]}>
              {isActive ? t('breathing.pause') : t('common.start')}
            </Text>
          </TouchableOpacity>
        </View>

        <ErrorToast
          visible={practiceError.visible}
          message={practiceError.message}
          code={practiceError.code}
          severity="error"
          duration={0}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      </View>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: spacing.sm,
  },
  balloonContainer: {
    ...sharedStyles.columnCenter,
    marginBottom: spacing.xxl,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  cycleCounter: {
    ...sharedStyles.rowCenter,
    gap: spacing.sm,
  },
  cycleText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    padding: spacing.xl,
    ...shadows.small,
  },
  header: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  loadingContainer: {
    ...sharedStyles.columnCenter,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
  },
  mainButton: {
    ...sharedStyles.rowCenter,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    height: 56,
  },
  mainButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  patternButton: {
    borderRadius: borderRadius.lg,
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...sharedStyles.columnCenter,
  },
  patternDesc: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  patternSelector: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  patternText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  phaseDot: {
    borderRadius: 6,
    height: 12,
    marginBottom: spacing.xs,
    width: 12,
  },
  phaseDuration: {
    fontSize: typography.fontSize.xs,
  },
  phaseGuideItem: {
    ...sharedStyles.columnCenter,
  },
  phaseGuideText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  phaseInfo: {
    ...sharedStyles.columnCenter,
    marginTop: spacing.xl,
  },
  phaseText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  phasesGuide: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  placeholder: {
    width: 40,
  },
  timerText: {
    fontSize: 64,
    fontWeight: typography.fontWeight.bold,
  },
});
