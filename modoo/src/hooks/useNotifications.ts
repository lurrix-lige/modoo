import { useEffect, useCallback } from 'react';
import { NotificationService } from '../services/NotificationService';
import { logger } from '../utils/logger';

export function useNotifications() {
  const initializeNotifications = useCallback(async () => {
    try {
      await NotificationService.getInstance().initialize();
      logger.debug('Notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize notification service', { error });
    }
  }, []);

  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  const scheduleBookingReminder = useCallback(
    async (bookingId: string, date: string, time: string, expertName: string) => {
      try {
        await NotificationService.getInstance().scheduleBookingReminder(
          bookingId,
          date,
          time,
          expertName,
        );
      } catch (error) {
        logger.error('Failed to schedule booking reminder', { error });
      }
    },
    [],
  );

  const presentNotification = useCallback(
    async (title: string, body: string, data?: Record<string, string>) => {
      try {
        await NotificationService.getInstance().presentLocalNotification(title, body, data);
      } catch (error) {
        logger.error('Failed to present notification', { error });
      }
    },
    [],
  );

  return {
    scheduleBookingReminder,
    presentNotification,
  };
}
