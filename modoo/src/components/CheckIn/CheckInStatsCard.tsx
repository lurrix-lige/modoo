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
          {t('checkIn.streak') || '连续打卡'}
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
          {t('checkIn.thisWeek') || '本周打卡'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xs,
  },
  statIcon: {
    width: iconSizes.xl,
    height: iconSizes.xl,
    borderRadius: iconSizes.xl / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  statDivider: {
    width: 1,
    marginHorizontal: spacing.lg,
  },
});
