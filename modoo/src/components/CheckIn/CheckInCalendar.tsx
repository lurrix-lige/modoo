import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { spacing, typography, responsive } from '../../theme';

interface CheckInCalendarProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  weekDays: string[];
  checkInHistory: Set<string>;
  todayChecked: boolean;
  colors: {
    surface: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    background: string;
    success?: string;
  };
}

export function CheckInCalendar({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  weekDays,
  checkInHistory,
  todayChecked,
  colors,
}: CheckInCalendarProps) {
  const { t } = useTranslation();
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysCount };
  };

  const { firstDay, daysCount } = getDaysInMonth(currentMonth);

  const renderDays = () => {
    const days = [];
    const now = new Date();

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell} />
      );
    }

    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const isCheckedIn = checkInHistory.has(dateStr);
      const isToday = day === now.getDate() && currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear();

      days.push(
        <View
          key={day}
          style={[
            styles.dayCell,
            isCheckedIn && { backgroundColor: colors.success || '#4CAF50' },
            isToday && { borderWidth: 2, borderColor: colors.success || '#4CAF50' },
          ]}
        >
          <Text
            style={[
              styles.dayText,
              { color: colors.textSecondary },
              isCheckedIn && !isToday && { color: colors.background },
              isToday && !isCheckedIn && { color: colors.primary },
              isToday && isCheckedIn && { color: colors.background },
            ]}
          >
            {day}
          </Text>
        </View>
      );
    }

    return days;
  };

  return (
    <View style={[styles.calendarCard, { backgroundColor: colors.surface }]}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={onPrevMonth}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.calendarTitle, { color: colors.textPrimary }]}>
          {((t('checkIn.months', { returnObjects: true }) as string[])[currentMonth.getMonth()] || `${currentMonth.getMonth() + 1}`)} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={onNextMonth}>
          <ChevronRight size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {weekDays.map((day, index) => (
          <Text key={index} style={[styles.weekDayText, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>{renderDays()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calendarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  weekDayText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    flex: 1,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: responsive.scale(36),
    height: responsive.verticalScale(36),
    borderRadius: responsive.moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
