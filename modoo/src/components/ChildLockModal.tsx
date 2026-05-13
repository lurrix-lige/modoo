import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Lock, Shield, CheckCircle, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, commonColors } from '../theme';

interface ChildLockModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChildLockModal({ visible, onSuccess, onCancel }: ChildLockModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const overlayColor = useMemo(() => {
    return colors.overlay;
  }, [colors.overlay]);

  const headerTitleColor = useMemo(() => {
    return commonColors.white;
  }, []);

  const headerSubtitleColor = useMemo(() => {
    return isDark ? colors.surface : commonColors.white;
  }, [isDark, colors.surface]);

  const cancelBorderColor = useMemo(() => {
    return colors.border;
  }, [colors.border]);

  const [num1] = React.useState(Math.floor(Math.random() * 9) + 1);
  const [num2] = React.useState(Math.floor(Math.random() * 9) + 1);
  const [answer, setAnswer] = React.useState('');
  const [error, setError] = React.useState(false);

  const handleSubmit = () => {
    if (parseInt(answer, 10) === num1 + num2) {
      onSuccess();
      setAnswer('');
      setError(false);
    } else {
      setError(true);
      setAnswer('');
    }
  };

  const handleNumberPress = (num: string) => {
    if (answer.length < 2) {
      setAnswer(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setAnswer(prev => prev.slice(0, -1));
    setError(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <Lock size={40} color={commonColors.white} />
            <Text style={[styles.headerTitle, { color: headerTitleColor }]}>{t('childLock.parentVerification')}</Text>
            <Text style={[styles.headerSubtitle, { color: headerSubtitleColor }]}>{t('childLock.verificationDesc')}</Text>
          </View>

          <View style={styles.content}>
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

            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {t('childLock.wrongAnswer')}
              </Text>
            )}

            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
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
                <CheckCircle size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.cancelButton, { borderTopColor: cancelBorderColor }]} onPress={onCancel}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('childLock.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    width: '100%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.xl,
  },
  mathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  mathNumber: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
  },
  mathOperator: {
    fontSize: 36,
    marginHorizontal: spacing.md,
  },
  answerBox: {
    width: 80,
    height: 60,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  answerText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '30%',
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  keyText: {
    fontSize: 24,
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  cancelText: {
    fontSize: typography.fontSize.md,
  },
});
