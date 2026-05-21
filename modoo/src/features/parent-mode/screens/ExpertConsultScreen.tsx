import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { SafeAreaContainer } from '../../../components';

import { ArrowLeft, User, Star } from 'lucide-react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useNavigation } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';

import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonColors,
  sharedStyles,
  responsive,
} from '../../../theme';

import { Button, AuthModal } from '../../../components';

import { ParentStackParamList } from '../../../navigation/types';

import { useAppStore } from '../../../store';

import { apiService, Expert } from '../../../services';

import { useNotifications } from '../../../hooks/useNotifications';

import { logger } from '../../../utils/logger';

import { formatCurrency } from '../../../utils/currency';

type ExpertConsultNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'ExpertConsult'>;

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export default function ExpertConsultScreen() {
  const navigation = useNavigation<ExpertConsultNavigationProp>();

  const { t, i18n } = useTranslation();

  const { colors } = useTheme();

  const { isAuthenticated } = useAppStore();

  const [selectedExpert, setSelectedExpert] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [experts, setExperts] = useState<Expert[]>([]);

  const { scheduleBookingReminder } = useNotifications();

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    setIsLoading(true);

    try {
      const response = await apiService.getExperts();

      setExperts(response.experts);
    } catch (error) {
      logger.error('Failed to load experts', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekdayLabel = (day: string) => {
    const weekdays = t('common.weekdays', { returnObjects: true }) as string[];

    const dayIndex = weekdays.indexOf(day);

    return weekdays[dayIndex >= 0 ? dayIndex : 0];
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();

    date.setDate(date.getDate() + i);

    const weekdays = t('common.weekdays', {
      returnObjects: true,
    }) as string[];

    return {
      day: date.getDate(),

      weekday: weekdays[date.getDay()],

      fullDate: date.toISOString().split('T')[0],
    };
  });

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('expertConsult.title')}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('expertConsult.selectExpert')}
          </Text>

          {experts.map((expert) => (
            <TouchableOpacity
              key={expert.id}
              style={[
                styles.expertCard,

                {
                  backgroundColor: colors.surface,

                  borderColor: selectedExpert === expert.id ? colors.primary : 'transparent',

                  borderWidth: selectedExpert === expert.id ? 2 : 0,
                },
              ]}
              onPress={() => setSelectedExpert(expert.id)}
            >
              <View style={[styles.expertAvatar, { backgroundColor: colors.primary + '20' }]}>
                <User size={32} color={colors.primary} />
              </View>

              <View style={styles.expertInfo}>
                <View style={styles.expertHeader}>
                  <Text style={[styles.expertName, { color: colors.textPrimary }]}>
                    {expert.name || t(expert.nameKey)}
                  </Text>

                  <View style={styles.rating}>
                    <Star size={14} color={colors.warning} />

                    <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                      {expert.rating}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.expertTitle, { color: colors.textSecondary }]}>
                  {expert.title || t(expert.titleKey)}
                </Text>

                <Text style={[styles.expertHospital, { color: colors.textSecondary }]}>
                  {expert.hospital || t(expert.hospitalKey)}
                </Text>

                <View style={styles.specialties}>
                  {(expert.specialties || expert.specialtyKeys || []).map(
                    (specialty: string, index: number) => (
                      <View
                        key={index}
                        style={[styles.specialtyTag, { backgroundColor: colors.border }]}
                      >
                        <Text style={[styles.specialtyText, { color: colors.textSecondary }]}>
                          {t(specialty)}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedExpert && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('expertConsult.selectDate')}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dates.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,

                    {
                      backgroundColor: selectedDate === index ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedDate(index)}
                >
                  <Text
                    style={[
                      styles.dateWeekday,

                      {
                        color: selectedDate === index ? commonColors.white : colors.textSecondary,
                      },
                    ]}
                  >
                    {getWeekdayLabel(date.weekday)}
                  </Text>

                  <Text
                    style={[
                      styles.dateDay,

                      {
                        color: selectedDate === index ? commonColors.white : colors.textPrimary,
                      },
                    ]}
                  >
                    {date.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {selectedExpert && selectedDate !== null && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('expertConsult.selectTime')}
            </Text>

            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeCard,

                    {
                      backgroundColor: selectedTime === time ? colors.primary : colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text
                    style={[
                      styles.timeText,

                      {
                        color: selectedTime === time ? commonColors.white : colors.textPrimary,
                      },
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {selectedExpert && selectedDate !== null && selectedTime && (
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <View style={styles.priceInfo}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
              {t('expertConsult.consultationFee')}
            </Text>

            <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
              {formatCurrency(99, 'CNY', i18n.language)}
              {t('expertConsult.perSession')}
            </Text>
          </View>

          <Button
            title={t('expertConsult.bookNow')}
            onPress={async () => {
              if (!isAuthenticated) {
                setShowAuthModal(true);

                return;
              }

              try {
                const expert = experts.find((e) => e.id === selectedExpert);

                const fullDate = dates[selectedDate || 0].fullDate;

                const response = await apiService.createBooking({
                  expertId: selectedExpert!,

                  date: fullDate,

                  time: selectedTime!,
                });

                const notificationSettings = await apiService.getNotificationSettings();

                if (notificationSettings.expertReminder) {
                  const expertName = expert?.name || t(expert?.nameKey || '');

                  await scheduleBookingReminder(response.id, fullDate, selectedTime!, expertName);
                }

                Alert.alert(
                  t('expertConsult.bookingSuccess'),
                  t('expertConsult.bookingSuccessMessage'),
                  [
                    {
                      text: t('common.confirm'),

                      onPress: () => navigation.navigate('ExpertBookings'),
                    },
                  ],
                );
              } catch (error) {
                logger.error('Failed to create booking', { error });

                Alert.alert(t('common.error'), t('expertConsult.bookingFailed'));
              }
            }}
          />
        </View>
      )}

      <AuthModal
        visible={showAuthModal}
        onLogin={() => {
          setShowAuthModal(false);

          navigation.getParent()?.navigate('Auth', { fromScreen: 'ExpertConsult' });
        }}
        onDismiss={() => setShowAuthModal(false)}
        title={t('expertConsult.loginToBook')}
        message={t('expertConsult.loginMessage')}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  avatarText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
  },

  backButton: {
    marginRight: spacing.md,
  },

  container: {
    flex: 1,
  },

  dateCard: {
    borderRadius: borderRadius.md,

    padding: spacing.md,

    width: 60,

    ...sharedStyles.columnCenter,

    marginRight: spacing.sm,
  },

  dateDay: {
    fontSize: typography.fontSize.lg,

    fontWeight: typography.fontWeight.bold,

    marginTop: spacing.xs,
  },

  dateWeekday: {
    fontSize: typography.fontSize.xs,
  },

  expertAvatar: {
    borderRadius: 32,

    height: 64,

    width: 64,

    ...sharedStyles.columnCenter,

    marginRight: spacing.md,
  },

  expertCard: {
    ...sharedStyles.rowStart,

    borderRadius: borderRadius.lg,

    marginBottom: spacing.md,

    padding: spacing.md,

    ...shadows.small,
  },

  expertHeader: {
    ...sharedStyles.rowBetween,
  },

  expertHospital: {
    fontSize: typography.fontSize.xs,
  },

  expertInfo: {
    flex: 1,
  },

  expertName: {
    fontSize: typography.fontSize.md,

    fontWeight: typography.fontWeight.semibold,
  },

  expertTitle: {
    fontSize: typography.fontSize.xs,

    marginTop: spacing.xs,
  },

  footer: {
    ...sharedStyles.rowStart,

    gap: spacing.lg,

    padding: spacing.lg,

    ...shadows.medium,
  },

  header: {
    ...sharedStyles.rowStart,

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.md,
  },

  priceInfo: {},

  priceLabel: {
    fontSize: typography.fontSize.xs,
  },

  priceValue: {
    fontSize: typography.fontSize.lg,

    fontWeight: typography.fontWeight.bold,
  },

  rating: {
    ...sharedStyles.rowStart,

    gap: 4,
  },

  ratingText: {
    fontSize: typography.fontSize.sm,

    fontWeight: typography.fontWeight.medium,
  },

  section: {
    marginBottom: spacing.xl,

    paddingHorizontal: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.fontSize.md,

    fontWeight: typography.fontWeight.semibold,

    marginBottom: spacing.md,
  },

  specialties: {
    ...sharedStyles.rowStart,

    flexWrap: 'wrap',

    gap: spacing.xs,

    marginTop: spacing.sm,
  },

  specialtyTag: {
    borderRadius: borderRadius.sm,

    paddingHorizontal: spacing.sm,

    paddingVertical: 2,
  },

  specialtyText: {
    fontSize: typography.fontSize.xs,
  },

  timeCard: {
    borderRadius: borderRadius.md,

    padding: spacing.md,

    width: '30%',

    ...sharedStyles.columnCenter,
  },

  timeGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: spacing.sm,
  },

  timeText: {
    fontSize: typography.fontSize.md,

    fontWeight: typography.fontWeight.medium,
  },

  title: {
    fontSize: typography.fontSize.lg,

    fontWeight: typography.fontWeight.semibold,
  },
});
