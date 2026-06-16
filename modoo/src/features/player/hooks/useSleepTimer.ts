import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '../../../utils/logger';

export function useSleepTimer(onExpire: () => void) {
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerDuration(null);
    setTimerRemainingSeconds(null);
  }, []);

  const handleTimerSelect = useCallback((minutes: number) => {
    setTimerDuration(minutes);
    setTimerRemainingSeconds(minutes * 60);
    setShowTimerModal(false);
    logger.info(`Sleep timer set for ${minutes} minutes`);
  }, []);

  const handleCancelTimer = useCallback(() => {
    clearTimer();
    setShowTimerModal(false);
    logger.info('Sleep timer cancelled');
  }, [clearTimer]);

  useEffect(() => {
    if (!timerDuration) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimerRemainingSeconds((prev) => {
        if (prev === null || prev <= 0) {
          return null;
        }
        const next = prev - 1;
        if (next <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          onExpireRef.current();
          logger.info('Sleep timer expired');
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerDuration]);

  useEffect(() => {
    if (timerRemainingSeconds !== null && timerRemainingSeconds <= 0) {
      clearTimer();
    }
  }, [timerRemainingSeconds, clearTimer]);

  const formatTimerRemaining = useCallback(
    (formatter: (seconds: number) => string): string | null => {
      if (timerRemainingSeconds === null) return null;
      return formatter(Math.max(0, timerRemainingSeconds));
    },
    [timerRemainingSeconds],
  );

  return {
    timerDuration,
    timerRemainingSeconds,
    showTimerModal,
    setShowTimerModal,
    handleTimerSelect,
    handleCancelTimer,
    clearTimer,
    formatTimerRemaining,
  };
}
