import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, spacing, borderRadius, typography, responsive, shadows, commonColors } from '../../../theme';
import { useTranslation } from 'react-i18next';

interface TimerModalProps {
  visible: boolean;
  timerDuration: number | null;
  onSelect: (duration: number) => void;
  onCancel: () => void;
  onCancelTimer: () => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  visible,
  timerDuration,
  onSelect,
  onCancel,
  onCancelTimer,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Hooks 必须在条件语句之前调用，确保每次渲染都以相同顺序执行
  const overlayColor = useMemo(() => colors.overlay, [colors.overlay]);
  const modalBackgroundColor = useMemo(() => colors.surface, [colors.surface]);
  const titleColor = useMemo(() => colors.textPrimary, [colors.textPrimary]);
  const cancelButtonTextColor = useMemo(() => colors.textSecondary, [colors.textSecondary]);
  const cancelTimerButtonTextColor = useMemo(() => commonColors.white, []);

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
      <View style={[styles.modal, { backgroundColor: modalBackgroundColor, ...shadows.large }]}>
        <Text style={[styles.modalTitle, { color: titleColor }]}>
          {t('storyPlayer.timerTitle')}
        </Text>
        <View style={styles.timerOptions}>
          {[15, 30, 45, 60, 90].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.timerOption,
                {
                  backgroundColor: timerDuration === minutes ? colors.primary : colors.surfaceVariant,
                  borderColor: timerDuration === minutes ? colors.primary : colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={() => onSelect(minutes)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.timerOptionText,
                  {
                    color: timerDuration === minutes ? commonColors.white : colors.textPrimary,
                  },
                ]}
              >
                {minutes} {t('common.minutes')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.surfaceVariant }]}
          onPress={onCancel}
          activeOpacity={0.85}
        >
          <Text style={[styles.cancelButtonText, { color: cancelButtonTextColor }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
        {timerDuration && (
          <TouchableOpacity
            style={[styles.cancelTimerButton, { backgroundColor: colors.error }]}
            onPress={onCancelTimer}
            activeOpacity={0.85}
          >
            <Text style={[styles.cancelTimerButtonText, { color: cancelTimerButtonTextColor }]}>
              {t('storyPlayer.cancelTimer')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    zIndex: 999,
  },
  modal: {
    width: '100%',
    maxWidth: responsive.moderateScale(340),
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  timerOptions: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  timerOption: {
    width: '45%',
    minWidth: responsive.moderateScale(100),
    height: responsive.verticalScale(48),
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerOptionText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    width: '100%',
    height: responsive.verticalScale(48),
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  cancelTimerButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.medium,
  },
});