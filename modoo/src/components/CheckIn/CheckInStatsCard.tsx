import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography, iconSizes, commonColors } from '../../theme';

interface CheckInStatsCardProps {
  streak: number;
  thisWeekCount: number;
  colors: {
    surface: string;
    textSecondary: string;
    accent: string;
    warning: string;
    primary: string;
    border: string;
  };
}

export function CheckInStatsCard({ streak, thisWeekCount, colors }: CheckInStatsCardProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
      <View style={styles.statItem}>
        <View style={styles.statRow}>
          <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
            <Flame size={iconSizes.md} color={commonColors.white} />
          </View>
          <Text style={[styles.statValue, { color: colors.accent }]}>{streak}</Text>
        </View>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {t('checkIn.streak')}
        </Text>
      </View>

      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

      <View style={styles.statItem}>
        <View style={styles.statRow}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
            <Calendar size={iconSizes.md} color={commonColors.white} />
          </View>
          <Text style={[styles.statValue, { color: colors.accent }]}>{thisWeekCount}</Text>
        </View>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {t('checkIn.thisWeek')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statDivider: {
    marginHorizontal: spacing.lg,
    width: 1,
  },
  statIcon: {
    alignItems: 'center',
    borderRadius: iconSizes.xl / 2,
    height: iconSizes.xl,
    justifyContent: 'center',
    width: iconSizes.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  statRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    width: '100%',
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  statsCard: {
    borderRadius: spacing.md,
    flexDirection: 'row',
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
});
