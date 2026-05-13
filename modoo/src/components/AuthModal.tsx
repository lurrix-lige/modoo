import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Lock, Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, commonColors, responsive, iconSizes } from '../theme';

interface AuthModalProps {
  visible: boolean;
  onLogin: () => void;
  onDismiss: () => void;
  title?: string;
  message?: string;
}

export function AuthModal({ visible, onLogin, onDismiss, title, message }: AuthModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const overlayColor = useMemo(() => {
    return colors.overlay;
  }, [colors.overlay]);

  const iconContainerColor = useMemo(() => {
    return colors.primaryLight;
  }, [colors.primaryLight]);

  const loginButtonTextColor = useMemo(() => {
    return commonColors.white;
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: iconContainerColor }]}>
            <Lock size={responsive.moderateScale(iconSizes.hero)} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title || t('auth.unlockContent')}
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message || t('auth.loginToExperience')}
          </Text>

          <View style={styles.features}>
            <FeatureItem text={t('auth.storyAudio')} />
            <FeatureItem text={t('auth.professionalCourses')} />
            <FeatureItem text={t('auth.exclusiveGuardian')} />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={onLogin}
              accessibilityRole="button"
              accessibilityLabel={t('auth.loginNow')}
            >
              <Text style={[styles.loginButtonText, { color: loginButtonTextColor }]}>{t('auth.loginNow')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel={t('auth.later')}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                {t('auth.later')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FeatureItem({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.featureItem}>
      <Shield size={responsive.moderateScale(iconSizes.md)} color={colors.primary} />
      <Text style={[styles.featureText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    width: '100%',
    maxWidth: responsive.moderateScale(360),
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  iconContainer: {
    width: responsive.moderateScale(80),
    height: responsive.moderateScale(80),
    borderRadius: responsive.moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  features: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  featureItem: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  featureText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  loginButton: {
    height: responsive.verticalScale(56),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    height: responsive.verticalScale(48),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
  },
});
