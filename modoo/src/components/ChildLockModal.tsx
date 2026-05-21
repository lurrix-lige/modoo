import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Lock, Shield, Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, commonColors, responsive } from '../theme';

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
      setAnswer((prev) => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setAnswer((prev) => prev.slice(0, -1));
    setError(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <Lock size={40} color={commonColors.white} />
            <Text style={[styles.headerTitle, { color: headerTitleColor }]}>
              {t('childLock.parentVerification')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: headerSubtitleColor }]}>
              {t('childLock.verificationDesc')}
            </Text>
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
                <Check size={24} color={commonColors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { borderTopColor: cancelBorderColor }]}
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
  cancelButton: {
    alignItems: 'center',
    borderTopWidth: 1,
    paddingVertical: spacing.lg,
  },
  cancelText: {
    fontSize: typography.fontSize.md,
  },
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: '100%',
  },
  content: {
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
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
});
