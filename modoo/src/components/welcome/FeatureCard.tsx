import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookOpen, Heart, Music, Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography } from '../../theme';
import { Card } from '../Card';

interface FeatureCardProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  titleKey: string;
  descriptionKey: string;
  onPress?: () => void;
}

export function FeatureCard({ icon: Icon, titleKey, descriptionKey, onPress }: FeatureCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Card style={styles.card} onPress={onPress} variant="glass" elevated>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Icon size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {t(titleKey)}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {t(descriptionKey)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    minHeight: 140,
    padding: spacing.lg,
  },
  cardContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
  },
  description: {
    flexGrow: 0,
    flexShrink: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 56,
  },
  title: {
    flexShrink: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
});
