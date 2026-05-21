import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, spacing, typography, borderRadius, commonColors, sharedStyles } from '../theme';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react-native';

interface ErrorStateProps {
  icon?: React.ComponentType<{ size: number; color: string }>;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  icon: Icon = AlertCircle,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}>
        <Icon size={64} color={colors.error} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title || t('common.error')}
      </Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      )}
      {onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onAction}
        >
          <Text style={[styles.actionText, { color: commonColors.white }]}>
            {actionLabel || t('common.retry')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...sharedStyles.rowCenter,
  },
  actionText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  description: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    height: 120,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 120,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
