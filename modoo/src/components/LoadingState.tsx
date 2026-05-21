import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, spacing, typography, commonColors } from '../theme';
import { useTranslation } from 'react-i18next';
import { Hourglass } from 'lucide-react-native';

interface LoadingStateProps {
  text?: string;
  size?: 'small' | 'large';
  icon?: React.ComponentType<{ size: number; color: string }>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ text, size = 'large', icon: Icon }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {Icon ? (
        <View style={styles.icon}>
          <Icon size={size === 'large' ? 48 : 32} color={colors.primary} />
        </View>
      ) : (
        <ActivityIndicator size={size === 'large' ? 'large' : 'small'} color={colors.primary} />
      )}
      <Text
        style={[
          styles.text,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {text || t('common.loading')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  icon: {
    marginBottom: spacing.md,
  },
  text: {
    fontSize: typography.fontSize.md,
    marginTop: spacing.md,
  },
});
