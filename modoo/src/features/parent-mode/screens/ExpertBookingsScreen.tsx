import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { ArrowLeft, Calendar, Clock, User, Phone, MapPin, ChevronRight, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles } from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { apiService, Booking, Expert } from '../../../services';
import { LoadingState, ErrorToast } from '../../../components';
import { logger } from '../../../utils/logger';

type ExpertBookingsNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'ExpertBookings'>;

interface BookingWithExpert extends Booking {
  expert?: Expert;
}

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusConfig: Record<BookingStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  pending: { label: 'expertBookings.pending', color: 'warning', bgColor: 'warningLight', icon: AlertCircle },
  confirmed: { label: 'expertBookings.confirmed', color: 'success', bgColor: 'successLight', icon: CheckCircle },
  completed: { label: 'expertBookings.completed', color: 'textSecondary', bgColor: 'border', icon: CheckCircle },
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
  const [error, setError] = useState<{ visible: boolean; message: string; code?: string }>({ visible: false, message: '' });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setIsLoading(true);
    setError({ visible: false, message: '' });
    try {
      const response = await apiService.getBookings();
      const bookingsWithExpert = await Promise.all(
        response.bookings.map(async (booking: Booking) => {
          let expert;
          try {
            const expertResponse = await apiService.getExpert(booking.expertId);
            expert = expertResponse;
          } catch {
            expert = undefined;
          }
          return { ...booking, expert };
        })
      );
      setBookings(bookingsWithExpert);
    } catch (error: any) {
      logger.error('Failed to load bookings', { error });
      setError({
        visible: true,
        message: t('expertBookings.loadError'),
        code: error?.code,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      t('expertBookings.confirmCancel'),
      t('expertBookings.cancelWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelBooking(bookingId);
              setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b
              ));
              Alert.alert(t('common.success'), t('expertBookings.cancelSuccess'));
            } catch (error) {
              logger.error('Failed to cancel booking', { error });
              Alert.alert(t('common.error'), t('expertBookings.cancelFailed'));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = t('common.weekdays', { returnObjects: true }) as string[] || ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    return {
      date: `${year}-${month}-${day}`,
      weekday: `周${weekday}`,
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
    const color = config.color === 'warning' ? colors.warning :
                  config.color === 'success' ? colors.success :
                  config.color === 'error' ? colors.error : colors.textSecondary;
    const bgColor = config.bgColor === 'warningLight' ? colors.warning + '20' :
                    config.bgColor === 'successLight' ? colors.success + '20' :
                    config.bgColor === 'errorLight' ? colors.error + '20' : colors.border;

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <IconComp size={14} color={color} />
        <Text style={[styles.statusText, { color }]}>
          {t(config.label)}
        </Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.surface }]}>
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
                      <View style={[styles.expertAvatar, { backgroundColor: colors.primary + '20' }]}>
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

const Button = ({ title, onPress, style }: { title: string; onPress: () => void; style?: object }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[{
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
      }, style]}
      onPress={onPress}
    >
      <Text style={{ color: commonColors.white, fontWeight: typography.fontWeight.medium }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.lg,
  },
  emptyDesc: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  bookingList: {
    gap: spacing.md,
  },
  bookingCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.small,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  cancelButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  expertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  expertAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  expertDetail: {},
  expertName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  expertTitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  bookingDetails: {
    gap: spacing.sm,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
  },
  noteSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  noteTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  noteContent: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});