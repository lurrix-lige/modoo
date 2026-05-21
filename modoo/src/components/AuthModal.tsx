import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Lock, Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  commonColors,
  responsive,
  iconSizes,
} from '../theme';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: iconContainerColor }]}>
            <Lock size={responsive.moderateScaleForIcon(iconSizes.hero)} color={colors.primary} />
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
              <Text style={[styles.loginButtonText, { color: loginButtonTextColor }]}>
                {t('auth.loginNow')}
              </Text>
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
      <Shield size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.primary} />
      <Text style={[styles.featureText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    gap: spacing.md,
    width: '100%',
  },
  cancelButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    height: responsive.verticalScale(48),
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  featureText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: responsive.moderateScale(40),
    height: responsive.moderateScale(80),
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: responsive.moderateScale(80),
  },
  loginButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    height: responsive.verticalScale(56),
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  message: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  modal: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    maxWidth: responsive.moderateScale(360),
    padding: spacing.xxl,
    width: '100%',
  },
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
