import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  SafeAreaContainer,
  useCheckIn,
  CheckInStatsCard,
  CheckInCalendar,
  CheckInHistoryList,
  TimePickerModal,
} from '../../../components';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Star, Moon, Sun, Footprints, Stamp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonColors,
  sharedStyles,
} from '../../../theme';
import { RootStackParamList } from '../../../navigation/types';
import { logger } from '../../../utils/logger';

type CheckInNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CheckInScreen() {
  const navigation = useNavigation<CheckInNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [showSleepTimePicker, setShowSleepTimePicker] = useState(false);
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);

  const {
    checkInData: { sleepTime, wakeTime, quality },
    setSleepTime,
    setWakeTime,
    setQuality,
    stats: { streak, thisWeekCount, todayChecked, checkInHistory, historyRecords },
    currentMonth,
    isLoading,
    actions: { handleCheckIn, goToPrevMonth, goToNextMonth },
  } = useCheckIn({
    onSuccess: () => {
      logger.info('Check-in successful', { screen: 'ChildCheckIn' });
    },
    onError: (error) => {
      logger.error('Check-in failed', { screen: 'ChildCheckIn', error });
    },
  });

  const weekDays = t('checkIn.weekdays', { returnObjects: true }) as string[];

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('checkIn.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('checkIn.subtitle')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <CheckInStatsCard streak={streak} thisWeekCount={thisWeekCount} colors={colors} />

        <View style={[styles.checkInCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.checkInTitle, { color: colors.textPrimary }]}>
            {t('checkIn.todayCheckIn')}
          </Text>

          {todayChecked && (
            <View
              style={[
                styles.checkedBadge,
                { backgroundColor: colors.surface, borderColor: colors.error },
              ]}
            >
              <Footprints size={24} color={colors.error} />
            </View>
          )}

          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                {t('checkIn.sleepTime')}
              </Text>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.background }]}
                onPress={() => setShowSleepTimePicker(true)}
              >
                <Moon size={20} color={colors.primary} />
                <Text style={[styles.timeValue, { color: colors.textPrimary }]}>{sleepTime}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeItem}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                {t('checkIn.wakeTime')}
              </Text>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.background }]}
                onPress={() => setShowWakeTimePicker(true)}
              >
                <Sun size={20} color={colors.warning} />
                <Text style={[styles.timeValue, { color: colors.textPrimary }]}>{wakeTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.qualitySection}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
              {t('checkIn.sleepQuality')}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setQuality(star)}>
                  <Star
                    size={32}
                    color={star <= quality ? colors.warning : colors.border}
                    fill={star <= quality ? colors.warning : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.checkInButton, styles.stampButton, { backgroundColor: colors.primary }]}
            onPress={handleCheckIn}
            activeOpacity={0.8}
            disabled={todayChecked}
          >
            <Stamp size={32} color={commonColors.white} />
          </TouchableOpacity>
        </View>

        <CheckInCalendar
          currentMonth={currentMonth}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          weekDays={weekDays}
          checkInHistory={checkInHistory}
          todayChecked={todayChecked}
          colors={colors}
        />

        <CheckInHistoryList records={historyRecords} colors={colors} />
      </ScrollView>

      <TimePickerModal
        visible={showSleepTimePicker}
        onClose={() => setShowSleepTimePicker(false)}
        onConfirm={(time) => {
          setSleepTime(time);
          setShowSleepTimePicker(false);
        }}
        initialTime={sleepTime}
        title={t('checkIn.selectSleepTime') || 'Select Sleep Time'}
      />

      <TimePickerModal
        visible={showWakeTimePicker}
        onClose={() => setShowWakeTimePicker(false)}
        onConfirm={(time) => {
          setWakeTime(time);
          setShowWakeTimePicker(false);
        }}
        initialTime={wakeTime}
        title={t('checkIn.selectWakeTime') || 'Select Wake Time'}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  checkInButton: {
    borderRadius: borderRadius.xl,
    bottom: spacing.lg,
    height: 64,
    position: 'absolute',
    right: spacing.lg,
    width: 64,
    ...shadows.large,
  },
  checkInCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    ...shadows.medium,
    position: 'relative',
  },
  checkInTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  checkedBadge: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  qualitySection: {
    marginBottom: spacing.lg,
  },
  stampButton: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  timeButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timeValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
});
