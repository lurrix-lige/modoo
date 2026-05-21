import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Moon, Sun, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography } from '../../theme';
import { CheckInRecord } from './useCheckIn';

interface CheckInHistoryListProps {
  records: CheckInRecord[];
  colors: {
    surface: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    warning: string;
    primary: string;
  };
}

export function CheckInHistoryList({ records, colors }: CheckInHistoryListProps) {
  const { t } = useTranslation();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = t('checkIn.weekdays', { returnObjects: true }) as string[];
    const weekDay = weekDays[date.getDay()];
    return t('checkIn.dateFormat', { month, day, weekDay });
  };

  const renderStars = (quality: number) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            color={star <= quality ? colors.warning : colors.border}
            fill={star <= quality ? colors.warning : 'none'}
          />
        ))}
      </View>
    );
  };

  if (records.length === 0) {
    return (
      <View style={[styles.historyCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t('checkIn.noHistory')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.historyCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
        {t('checkIn.history')}
      </Text>
      <View style={styles.historyList}>
        {records.slice(0, 7).map((record, index) => (
          <View key={index} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
              {formatDate(record.date)}
            </Text>
            <View style={styles.historyDetails}>
              <View style={styles.timeItem}>
                <Moon size={14} color={colors.primary} />
                <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                  {record.sleepTime || '--:--'}
                </Text>
              </View>
              <View style={styles.timeItem}>
                <Sun size={14} color={colors.warning} />
                <Text style={[styles.timeText, { color: colors.textPrimary }]}>
                  {record.wakeTime || '--:--'}
                </Text>
              </View>
              {renderStars(record.quality)}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  historyCard: {
    borderRadius: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  historyDate: {
    fontSize: typography.fontSize.sm,
  },
  historyDetails: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  historyItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  historyList: {
    gap: spacing.md,
  },
  historyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  timeItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
