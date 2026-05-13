import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowRight, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography } from '../../theme';
import { Button } from '../Button';
import { Card } from '../Card';

interface GentleInvitationProps {
  onStart: () => void;
}

export function GentleInvitation({ onStart }: GentleInvitationProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Card style={styles.card} variant="glass" elevated>
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Star size={32} color={colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {t('welcome.inviteTitle')}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {t('welcome.inviteDesc')}
            </Text>
          </View>
          <Button
            title={t('welcome.exploreButton')}
            onPress={onStart}
            style={styles.button}
            variant="primary"
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  card: {
    padding: spacing.lg,
    minHeight: 120,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    flexShrink: 1,
  },
  description: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    flexShrink: 1,
    flexGrow: 0,
  },
  button: {
    marginLeft: spacing.md,
    flexShrink: 0,
  },
});
