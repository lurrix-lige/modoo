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
  button: {
    flexShrink: 0,
    marginLeft: spacing.md,
  },
  card: {
    minHeight: 120,
    padding: spacing.lg,
  },
  cardContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  container: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  description: {
    flexGrow: 0,
    flexShrink: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flexShrink: 0,
    height: 56,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 56,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  title: {
    flexShrink: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
});
