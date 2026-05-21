import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
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
} from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { apiService, Booking, Expert } from '../../../services';
import { LoadingState, ErrorToast, Button } from '../../../components';
import { logger } from '../../../utils/logger';

type ExpertBookingsNavigationProp = NativeStackNavigationProp<
  ParentStackParamList,
  'ExpertBookings'
>;

interface BookingWithExpert extends Booking {
  expert?: Expert;
}

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusConfig: Record<
  BookingStatus,
  { label: string; color: string; bgColor: string; icon: typeof CheckCircle }
> = {
  pending: {
    label: 'expertBookings.pending',
    color: 'warning',
    bgColor: 'warningLight',
    icon: AlertCircle,
  },
  confirmed: {
    label: 'expertBookings.confirmed',
    color: 'success',
    bgColor: 'successLight',
    icon: CheckCircle,
  },
  completed: {
    label: 'expertBookings.completed',
    color: 'textSecondary',
    bgColor: 'border',
    icon: CheckCircle,
  },
  cancelled: { label: 'expertBookings.cancelled', color: 'error', bgColor: 'errorLight', icon: X },
};

const normalizeStatus = (status: string): BookingStatus => {
  const normalized = status.toLowerCase().trim() as BookingStatus;
  return statusConfig[normalized] ? normalized : 'pending';
};

export default function ExpertBookingsScreen() {
  const navigation = useNavigation<ExpertBookingsNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [bookings, setBookings] = useState<BookingWithExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ visible: boolean; message: string; code?: string }>({
    visible: false,
    message: '',
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const fetchBookingsWithExperts = async (): Promise<BookingWithExpert[]> => {
    const response = await apiService.getBookings();
    const uniqueExpertIds = [...new Set(response.bookings.map((b: Booking) => b.expertId))];
    const expertMap = new Map<string, Expert>();
    await Promise.all(
      uniqueExpertIds.map(async (expertId) => {
        try {
          const expertResponse = await apiService.getExpert(expertId);
          expertMap.set(expertId, expertResponse);
        } catch {
          expertMap.set(expertId, undefined as unknown as Expert);
        }
      }),
    );
    return response.bookings.map((booking: Booking) => ({
      ...booking,
      expert: expertMap.get(booking.expertId),
    }));
  };

  const loadBookings = async () => {
    setIsLoading(true);
    setError({ visible: false, message: '' });
    try {
      const bookingsWithExpert = await fetchBookingsWithExperts();
      setBookings(bookingsWithExpert);
    } catch (err: unknown) {
      logger.error('Failed to load bookings', { error: err });
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as Record<string, unknown>).code)
          : undefined;
      setError({
        visible: true,
        message: t('expertBookings.loadError'),
        code,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const bookingsWithExpert = await fetchBookingsWithExperts();
      setBookings(bookingsWithExpert);
    } catch (err) {
      logger.error('Failed to refresh bookings', { error: err });
      setError({
        visible: true,
        message: t('expertBookings.loadError'),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(t('expertBookings.confirmCancel'), t('expertBookings.cancelWarning'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.cancelBooking(bookingId);
            setBookings((prev) =>
              prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b)),
            );
            Alert.alert(t('common.success'), t('expertBookings.cancelSuccess'));
          } catch (error) {
            logger.error('Failed to cancel booking', { error });
            Alert.alert(t('common.error'), t('expertBookings.cancelFailed'));
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = (t('common.weekdays', { returnObjects: true }) as string[]) || [
      '日',
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
    ];
    const weekday = weekdays[date.getDay()];
    return {
      date: `${year}-${month}-${day}`,
      weekday: `${weekday}`,
    };
  };

  const handleRetry = () => {
    loadBookings();
  };

  const handleDismissError = () => {
    setError({ visible: false, message: '' });
  };

  const renderStatusBadge = (status: BookingStatus) => {
    const config = statusConfig[status];
    const IconComp = config.icon;
    const color =
      config.color === 'warning'
        ? colors.warning
        : config.color === 'success'
          ? colors.success
          : config.color === 'error'
            ? colors.error
            : colors.textSecondary;
    const bgColor =
      config.bgColor === 'warningLight'
        ? colors.warning + '20'
        : config.bgColor === 'successLight'
          ? colors.success + '20'
          : config.bgColor === 'errorLight'
            ? colors.error + '20'
            : colors.border;

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <IconComp size={14} color={color} />
        <Text style={[styles.statusText, { color }]}>{t(config.label)}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('expertBookings.title')}
          </Text>
        </View>
        <LoadingState text={t('common.loading')} />
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('expertBookings.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {t('expertBookings.emptyTitle')}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              {t('expertBookings.emptyDesc')}
            </Text>
            <Button
              title={t('expertBookings.bookNow')}
              onPress={() => navigation.navigate('ExpertConsult')}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          <View style={styles.bookingList}>
            {bookings.map((booking) => {
              const { date: formattedDate, weekday } = formatDate(booking.date);
              const status = normalizeStatus(booking.status);
              const canCancel = status === 'pending' || status === 'confirmed';

              return (
                <View
                  key={booking.id}
                  style={[styles.bookingCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.bookingHeader}>
                    {renderStatusBadge(status)}
                    {canCancel && (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking.id)}
                      >
                        <Text style={[styles.cancelText, { color: colors.error }]}>
                          {t('expertBookings.cancel')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {booking.expert && (
                    <View style={styles.expertInfo}>
                      <View
                        style={[styles.expertAvatar, { backgroundColor: colors.primary + '20' }]}
                      >
                        <User size={24} color={colors.primary} />
                      </View>
                      <View style={styles.expertDetail}>
                        <Text style={[styles.expertName, { color: colors.textPrimary }]}>
                          {booking.expert.name || t(booking.expert.nameKey)}
                        </Text>
                        <Text style={[styles.expertTitle, { color: colors.textSecondary }]}>
                          {booking.expert.title || t(booking.expert.titleKey)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.bookingDetails}>
                    <View style={styles.dateTimeRow}>
                      <View style={styles.detailRow}>
                        <Calendar size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          {weekday} {formattedDate}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Clock size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          {booking.time}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {booking.notes && (
                    <View style={styles.noteSection}>
                      <Text style={[styles.noteTitle, { color: colors.textSecondary }]}>
                        {t('expertBookings.note')}
                      </Text>
                      <Text style={[styles.noteContent, { color: colors.textPrimary }]}>
                        {booking.notes}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ErrorToast
        visible={error.visible}
        message={error.message}
        code={error.code}
        severity="error"
        duration={0}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginRight: spacing.md,
  },
  bookingCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.small,
  },
  bookingDetails: {
    gap: spacing.sm,
  },
  bookingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bookingList: {
    gap: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  dateTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
  },
  emptyDesc: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.lg,
  },
  expertAvatar: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 48,
  },
  expertDetail: {},
  expertInfo: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
  },
  expertName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  expertTitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  noteContent: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  noteSection: {
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  noteTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
});
