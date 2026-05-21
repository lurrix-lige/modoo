import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../../services';
import { logger } from '../../utils/logger';
import { useTranslation } from 'react-i18next';

export interface CheckInData {
  sleepTime: string;
  wakeTime: string;
  quality: number;
}

export interface CheckInRecord {
  date: string;
  sleepTime: string;
  wakeTime: string;
  quality: number;
}

export interface CheckInStats {
  streak: number;
  thisWeekCount: number;
  todayChecked: boolean;
  todayCheckIn: any;
  checkInHistory: Set<string>;
  historyRecords: CheckInRecord[];
}

export interface UseCheckInOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  enableValidation?: boolean;
  showAlerts?: boolean;
}

export function useCheckIn(options: UseCheckInOptions = {}) {
  const { onSuccess, onError, enableValidation = false, showAlerts = false } = options;
  const { t } = useTranslation();

  const [sleepTime, setSleepTime] = useState('21:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(4);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [thisWeekCount, setThisWeekCount] = useState(0);
  const [todayChecked, setTodayChecked] = useState(false);
  const [todayCheckIn, setTodayCheckIn] = useState<any>(null);
  const [checkInHistory, setCheckInHistory] = useState<Set<string>>(new Set());
  const [historyRecords, setHistoryRecords] = useState<CheckInRecord[]>([]);

  const getCheckInDate = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 0 && hour < 6) {
      now.setDate(now.getDate() - 1);
    }
    return now.toISOString().split('T')[0];
  }, []);

  const validateTime = useCallback((time: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  }, []);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysCount };
  }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }, [currentMonth]);

  const loadCheckInData = useCallback(async () => {
    try {
      logger.debug('[CheckIn] Loading check-in data...');

      try {
        const streakData = await apiService.getStreak();
        setStreak(streakData.streak || 0);
        logger.debug('[CheckIn] Streak response', { streakData });
      } catch (error) {
        setStreak(0);
        logger.debug('[CheckIn] Failed to fetch streak, using default value');
      }

      try {
        const todayCheck = await apiService.getTodayCheckIn();
        if (todayCheck) {
          logger.debug('[CheckIn] Today check-in', { todayCheck });
          setTodayChecked(true);
          setTodayCheckIn(todayCheck);
          setSleepTime(todayCheck.sleepTime || '21:30');
          setWakeTime(todayCheck.wakeTime || '07:00');
          setQuality(todayCheck.quality || 4);
        } else {
          setTodayChecked(false);
        }
      } catch (error) {
        setTodayChecked(false);
      }

      try {
        const historyData = await apiService.getCheckInHistory();
        logger.debug('[CheckIn] History', { historyData });
        const historySet = new Set(historyData.map((item: any) => item.date));
        setCheckInHistory(historySet);
        setHistoryRecords(
          historyData.map((item: any) => ({
            date: item.date,
            sleepTime: item.sleepTime || '',
            wakeTime: item.wakeTime || '',
            quality: item.quality || 0,
          })),
        );

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const thisWeekCount = historyData.filter((item: any) => {
          const itemDate = new Date(item.date);
          return itemDate >= startOfWeek;
        }).length;
        setThisWeekCount(thisWeekCount);
      } catch (error) {
        setThisWeekCount(0);
        setHistoryRecords([]);
      }

      logger.debug('[CheckIn] Data loaded successfully!');
    } catch (error) {
      logger.error('[CheckIn] Failed to load check-in data', { error });
    }
  }, []);

  const handleCheckIn = useCallback(async () => {
    const checkInDate = getCheckInDate();

    if (enableValidation) {
      if (!validateTime(sleepTime)) {
        if (showAlerts) {
          Alert.alert(
            t('checkIn.error') || 'Error',
            t('checkIn.invalidSleepTime') || 'Invalid sleep time format',
          );
        }
        return;
      }

      if (!validateTime(wakeTime)) {
        if (showAlerts) {
          Alert.alert(
            t('checkIn.error') || 'Error',
            t('checkIn.invalidWakeTime') || 'Invalid wake time format',
          );
        }
        return;
      }
    }

    setIsLoading(true);
    try {
      logger.debug('[CheckIn] Submitting check-in for date', {
        checkInDate,
        sleepTime,
        wakeTime,
        quality,
      });
      await apiService.checkIn({
        date: checkInDate,
        sleepTime,
        wakeTime,
        quality,
      });
      logger.debug('[CheckIn] Check-in submitted successfully');
      setTodayChecked(true);

      if (showAlerts) {
        Alert.alert(
          t('checkIn.title') || 'Success',
          t('checkIn.checkInSuccess') || 'Check-in recorded successfully!',
          [{ text: t('common.ok') || 'OK' }],
        );
      }

      await loadCheckInData();
      onSuccess?.();
    } catch (error) {
      logger.error('[CheckIn] Failed to check in', { error });
      if (showAlerts) {
        Alert.alert(
          t('common.error') || 'Error',
          t('checkIn.checkInFailed') || 'Failed to record check-in. Please try again.',
        );
      }
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    sleepTime,
    wakeTime,
    quality,
    getCheckInDate,
    validateTime,
    enableValidation,
    showAlerts,
    loadCheckInData,
    onSuccess,
    onError,
    t,
  ]);

  useEffect(() => {
    loadCheckInData();
  }, [loadCheckInData]);

  return {
    checkInData: { sleepTime, wakeTime, quality },
    setSleepTime,
    setWakeTime,
    setQuality,
    stats: { streak, thisWeekCount, todayChecked, todayCheckIn, checkInHistory, historyRecords },
    currentMonth,
    isLoading,
    actions: {
      handleCheckIn,
      goToPrevMonth,
      goToNextMonth,
      loadCheckInData,
    },
    helpers: {
      getCheckInDate,
      getDaysInMonth,
      validateTime,
    },
  };
}
