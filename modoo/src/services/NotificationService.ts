import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiService } from '../infrastructure/api';
import { logger } from '../utils/logger';
import { CONFIG } from '../config/env';

const ENABLE_PUSH_NOTIFICATIONS = false;

export class NotificationService {
  private static instance: NotificationService;
  private token: string | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!ENABLE_PUSH_NOTIFICATIONS) {
      logger.debug('Push notifications are disabled in configuration');
      this.isInitialized = true;
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Notification permissions not granted');
      this.isInitialized = true;
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: CONFIG.expo.PROJECT_ID,
      });
      this.token = token.data;
      await this.registerTokenWithBackend();
      logger.debug('Push token registered successfully');
    } catch (pushError) {
      logger.warn('Failed to get Expo push token', { pushError });
      this.token = null;
    }

    this.isInitialized = true;
    this.setupNotificationListeners();
  }

  private async registerTokenWithBackend(): Promise<void> {
    if (!this.token) return;

    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await apiService.registerPushToken({
        token: this.token,
        platform,
      });
    } catch (error) {
      logger.error('Failed to register push token', { error });
    }
  }

  private setupNotificationListeners(): void {
    Notifications.addNotificationReceivedListener((notification) => {
      logger.debug('Notification received', { notification });
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      logger.debug('Notification response', { response });
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as Record<string, string>;
    logger.debug('Notification data', { data });

    if (data?.type === 'booking_reminder') {
      const bookingId = data?.bookingId;
      if (bookingId) {
        logger.debug('Navigate to booking detail', { bookingId });
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public async scheduleBookingReminder(
    bookingId: string,
    date: string,
    time: string,
    expertName: string,
  ): Promise<void> {
    logger.debug('Booking reminder scheduled (notifications temporarily disabled)', {
      bookingId,
      date,
      time,
      expertName,
    });

    // TODO: 实现定时通知功能，需要先正确配置 expo-notifications
    // 目前暂时禁用，确保预约功能正常工作
  }

  public async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      logger.error('Failed to cancel notification', { error });
    }
  }

  public async presentLocalNotification(
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const notificationRequest: Notifications.NotificationRequestInput = {
        content: {
          title,
          body,
          data,
        },
        trigger: null,
      };
      await Notifications.scheduleNotificationAsync(notificationRequest);
    } catch (error) {
      logger.error('Failed to present notification', { error });
    }
  }
}
