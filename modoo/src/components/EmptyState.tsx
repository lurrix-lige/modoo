import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme, spacing, typography, borderRadius, commonColors, sharedStyles } from '../theme';
import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.primary + '15' },
        ]}
      >
        <Icon
          size={64}
          color={colors.primary}
        />
      </View>
      <Text
        style={[
          styles.title,
          { color: colors.textPrimary },
        ]}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.description,
            { color: colors.textSecondary },
          ]}
        >
          {description}
        </Text>
      )}
      {onAction && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={onAction}
        >
          <Text
            style={[
              styles.actionText,
              { color: commonColors.white },
            ]}
          >
            {actionLabel || t('common.retry')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  actionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...sharedStyles.rowCenter,
  },
  actionText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
