import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme, spacing, borderRadius, typography, responsive, shadows, commonColors } from '../theme';
import { useTranslation } from 'react-i18next';

const DEFAULT_TIMER_OPTIONS = [15, 30, 45, 60, 90];

export interface TimerModalProps {
  visible: boolean;
  timerDuration: number | null;
  timerOptions?: number[];
  onSelect: (minutes: number) => void;
  onCancel: () => void;
  onCancelTimer: () => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  visible,
  timerDuration,
  timerOptions = DEFAULT_TIMER_OPTIONS,
  onSelect,
  onCancel,
  onCancelTimer,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const overlayColor = useMemo(() => 'rgba(0,0,0,0.4)', []);
  const modalBg = useMemo(() => colors.surface, [colors.surface]);
  const titleColor = useMemo(() => colors.textPrimary, [colors.textPrimary]);
  const cancelTextColor = useMemo(() => colors.textSecondary, [colors.textSecondary]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View
          style={[styles.modal, { backgroundColor: modalBg }, shadows.large]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={[styles.title, { color: titleColor }]}>
            {t('timer.title')}
          </Text>

          <View style={styles.optionsGrid}>
            {timerOptions.map((minutes) => {
              const isActive = timerDuration === minutes;
              return (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isActive ? colors.primary : colors.background,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => onSelect(minutes)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isActive ? commonColors.white : colors.textPrimary },
                    ]}
                  >
                    {minutes} {t('common.minutes')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.background }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: cancelTextColor }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>

          {timerDuration !== null && (
            <TouchableOpacity
              style={[styles.cancelTimerButton, { backgroundColor: colors.error }]}
              onPress={onCancelTimer}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelTimerButtonText, { color: commonColors.white }]}>
                {t('timer.cancelTimer')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    width: '100%',
    maxWidth: responsive.moderateScale(340),
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  optionsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  option: {
    width: '45%',
    minWidth: responsive.moderateScale(100),
    height: responsive.verticalScale(48),
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    width: '100%',
    height: responsive.verticalScale(48),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.medium,
  },
  cancelTimerButton: {
    width: '100%',
    height: responsive.verticalScale(48),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  cancelTimerButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.medium,
  },
});
