import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import {
  X,
  ArrowLeft,
  RotateCcw,
  RotateCw,
  ArrowUp,
  Lock,
  RefreshCw,
  CheckCircle,
  Moon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, commonColors, responsive } from '../theme';

interface EnhancedChildLockProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

type VerificationType = 'addition' | 'rotation';

interface RotationState {
  currentAngle: number;
  targetAngle: number;
  tolerance: number;
}

export function EnhancedChildLock({ visible, onSuccess, onCancel }: EnhancedChildLockProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [verificationType, setVerificationType] = useState<VerificationType>('addition');

  const overlayColor = useMemo(() => {
    return colors.overlay;
  }, [colors.overlay]);

  const whiteSemiTransparent = useMemo(() => {
    return isDark ? colors.surface : commonColors.white;
  }, [isDark, colors.surface]);

  const semiTransparent = useMemo(() => {
    return isDark ? colors.surfaceVariant : colors.primaryLight;
  }, [isDark, colors.surfaceVariant, colors.primaryLight]);

  const cancelButtonBorder = useMemo(() => {
    return colors.border;
  }, [colors.border]);

  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const [rotation, setRotation] = useState<RotationState>({
    currentAngle: 0,
    targetAngle: 0,
    tolerance: 15,
  });
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      generateNewProblem();
    }
  }, [visible, verificationType]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutUntil) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        setLockoutRemaining(remaining);
        if (remaining === 0) {
          setLockoutUntil(null);
          setErrorCount(0);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const generateNewProblem = () => {
    if (verificationType === 'addition') {
      const n1 = Math.floor(Math.random() * 16) + 5;
      const n2 = Math.floor(Math.random() * 16) + 5;
      setNum1(n1);
      setNum2(n2);
    } else {
      const targetAngle = Math.floor(Math.random() * 4) * 90;
      setRotation((prev) => ({ ...prev, currentAngle: 0, targetAngle }));
      Animated.timing(rotationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();
    }
    setAnswer('');
    setError(false);
  };

  const handleSubmit = () => {
    if (verificationType === 'addition') {
      if (parseInt(answer, 10) === num1 + num2) {
        handleSuccess();
      } else {
        handleError();
      }
    } else {
      const normalizedCurrent = ((rotation.currentAngle % 360) + 360) % 360;
      const normalizedTarget = ((rotation.targetAngle % 360) + 360) % 360;
      const diff = Math.min(
        Math.abs(normalizedCurrent - normalizedTarget),
        360 - Math.abs(normalizedCurrent - normalizedTarget),
      );
      if (diff <= rotation.tolerance) {
        handleSuccess();
      } else {
        handleError();
      }
    }
  };

  const handleSuccess = () => {
    setAnswer('');
    setError(false);
    setErrorCount(0);
    onSuccess();
  };

  const handleError = () => {
    const newErrorCount = errorCount + 1;
    setErrorCount(newErrorCount);
    setError(true);
    setAnswer('');

    if (newErrorCount >= 3) {
      setLockoutUntil(Date.now() + 30000);
      setLockoutRemaining(30);
    }

    generateNewProblem();
  };

  const handleNumberPress = (num: string) => {
    if (answer.length < 2) {
      setAnswer((prev) => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setAnswer((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleRotation = (direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? 45 : -45;
    const newAngle = rotation.currentAngle + delta;
    setRotation((prev) => ({ ...prev, currentAngle: newAngle }));

    Animated.timing(rotationAnim, {
      toValue: (newAngle % 360) / 360,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  const toggleVerificationType = () => {
    setVerificationType((prev) => (prev === 'addition' ? 'rotation' : 'addition'));
    generateNewProblem();
  };

  if (!visible) return null;

  if (lockoutUntil) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
          <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <View style={[styles.lockoutHeader, { backgroundColor: colors.error }]}>
              <Lock size={48} color={commonColors.white} />
              <Text style={[styles.lockoutTitle, { color: commonColors.white }]}>
                {t('childLock.locked')}
              </Text>
              <Text style={[styles.lockoutSubtitle, { color: whiteSemiTransparent }]}>
                {t('childLock.tooManyAttempts')}
              </Text>
            </View>
            <View style={styles.lockoutContent}>
              <Text style={[styles.lockoutTimer, { color: colors.error }]}>{lockoutRemaining}</Text>
              <Text style={[styles.lockoutText, { color: colors.textSecondary }]}>
                {t('childLock.secondsToRetry')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.cancelButton, { borderTopColor: cancelButtonBorder }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                {t('childLock.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={styles.headerTop}>
              <CheckCircle size={32} color={commonColors.white} />
              <TouchableOpacity
                style={[styles.toggleButton, { backgroundColor: semiTransparent }]}
                onPress={toggleVerificationType}
              >
                <Text style={[styles.toggleText, { color: commonColors.white }]}>
                  {verificationType === 'addition'
                    ? t('childLock.switchGraphical')
                    : t('childLock.switchCalculation')}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.headerTitle, { color: commonColors.white }]}>
              {t('childLock.parentVerification')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: whiteSemiTransparent }]}>
              {t('childLock.verificationDesc', {
                type:
                  verificationType === 'addition'
                    ? t('childLock.calculation')
                    : t('childLock.graphical'),
              })}
            </Text>
          </View>

          <View style={styles.content}>
            {verificationType === 'addition' ? (
              <View style={styles.mathContainer}>
                <Text style={[styles.mathNumber, { color: colors.textPrimary }]}>{num1}</Text>
                <Text style={[styles.mathOperator, { color: colors.textSecondary }]}>+</Text>
                <Text style={[styles.mathNumber, { color: colors.textPrimary }]}>{num2}</Text>
                <Text style={[styles.mathOperator, { color: colors.textSecondary }]}>=</Text>
                <View
                  style={[
                    styles.answerBox,
                    {
                      borderColor: error ? colors.error : colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <Text style={[styles.answerText, { color: colors.textPrimary }]}>
                    {answer || '?'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.rotationContainer}>
                <Text style={[styles.rotationHint, { color: colors.textSecondary }]}>
                  {t('childLock.rotationHint')}
                </Text>
                <View style={[styles.rotationCircle, { borderColor: colors.primary }]}>
                  <Animated.View
                    style={[
                      styles.rotationIndicator,
                      {
                        backgroundColor: colors.primary,
                        transform: [
                          {
                            rotate: rotationAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Moon size={40} color={colors.textPrimary} />
                  </Animated.View>
                  <View style={styles.rotationArrow}>
                    <ArrowUp size={20} color={colors.warning} />
                  </View>
                </View>
                <View style={styles.rotationControls}>
                  <TouchableOpacity
                    style={[styles.rotationButton, { backgroundColor: colors.background }]}
                    onPress={() => handleRotation('ccw')}
                  >
                    <RotateCcw size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rotationButton, { backgroundColor: colors.background }]}
                    onPress={() => handleRotation('cw')}
                  >
                    <RotateCw size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {t('childLock.wrongAnswer')}
                {verificationType === 'addition'
                  ? t('childLock.retryCalculation')
                  : t('childLock.retryAdjustment')}
              </Text>
            )}

            {errorCount > 0 && errorCount < 3 && (
              <Text style={[styles.attemptsText, { color: colors.textSecondary }]}>
                {t('childLock.remainingAttempts', { attempts: 3 - errorCount })}
              </Text>
            )}

            {verificationType === 'addition' ? (
              <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.key, { backgroundColor: colors.background }]}
                    onPress={() => handleNumberPress(num.toString())}
                  >
                    <Text style={[styles.keyText, { color: colors.textPrimary }]}>{num}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.key, { backgroundColor: colors.background }]}
                  onPress={handleDelete}
                >
                  <X size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.key, { backgroundColor: colors.background }]}
                  onPress={() => handleNumberPress('0')}
                >
                  <Text style={[styles.keyText, { color: colors.textPrimary }]}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.key, { backgroundColor: colors.primary }]}
                  onPress={handleSubmit}
                >
                  <CheckCircle size={24} color={commonColors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
              >
                <Text style={[styles.submitButtonText, { color: commonColors.white }]}>
                  {t('childLock.confirm')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { borderTopColor: cancelButtonBorder }]}
            onPress={onCancel}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              {t('childLock.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  answerBox: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    height: 60,
    justifyContent: 'center',
    marginLeft: spacing.md,
    width: 80,
  },
  answerText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  attemptsText: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    borderTopWidth: 1,
    paddingVertical: spacing.lg,
  },
  cancelText: { fontSize: typography.fontSize.md },
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: '100%',
  },
  content: { padding: spacing.xl },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  header: { alignItems: 'center', paddingVertical: spacing.xxl },
  headerSubtitle: { fontSize: typography.fontSize.sm, marginTop: spacing.xs },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.sm,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  key: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: '30%',
  },
  keyText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.semibold,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lockoutContent: { alignItems: 'center', padding: spacing.xxl },
  lockoutHeader: { alignItems: 'center', paddingVertical: spacing.xxl },
  lockoutSubtitle: { fontSize: typography.fontSize.sm, marginTop: spacing.xs },
  lockoutText: { fontSize: typography.fontSize.md, marginTop: spacing.sm },
  lockoutTimer: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxxl),
    fontWeight: typography.fontWeight.bold,
  },
  lockoutTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  mathContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  mathNumber: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxxl),
    fontWeight: typography.fontWeight.bold,
  },
  mathOperator: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    marginHorizontal: spacing.md,
  },
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  rotationArrow: { position: 'absolute', top: 10 },
  rotationButton: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  rotationCircle: {
    alignItems: 'center',
    borderRadius: 80,
    borderWidth: 4,
    height: 160,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 160,
  },
  rotationContainer: { alignItems: 'center', marginBottom: spacing.xl },
  rotationControls: { flexDirection: 'row', gap: spacing.xl },
  rotationHint: { fontSize: typography.fontSize.sm, marginBottom: spacing.lg },
  rotationIndicator: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    height: 56,
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  toggleButton: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  toggleText: { fontSize: typography.fontSize.xs },
});
