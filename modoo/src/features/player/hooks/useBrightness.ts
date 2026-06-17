import { useState, useCallback, useRef, useEffect } from 'react';
import * as Brightness from 'expo-brightness';
import { logger } from '../../../utils/logger';

export interface UseBrightnessReturn {
  brightness: number;
  isNightMode: boolean;
  toggleBrightness: () => void;
  setBrightness: (value: number) => void;
}

export function useBrightness(): UseBrightnessReturn {
  const [brightness, setBrightnessState] = useState(1);
  const [isNightMode, setIsNightMode] = useState(false);
  const originalBrightnessRef = useRef<number | null>(null);
  const hasModifiedRef = useRef(false);

  useEffect(() => {
    Brightness.getBrightnessAsync()
      .then((val) => { originalBrightnessRef.current = val; })
      .catch(() => {});
    return () => {
      if (hasModifiedRef.current && originalBrightnessRef.current !== null) {
        Brightness.setBrightnessAsync(originalBrightnessRef.current).catch(() => {});
      }
    };
  }, []);

  const saveOriginalIfNeeded = useCallback(async () => {
    if (originalBrightnessRef.current === null) {
      try {
        originalBrightnessRef.current = await Brightness.getBrightnessAsync();
      } catch {}
    }
  }, []);

  const setBrightness = useCallback(async (value: number) => {
    try {
      await saveOriginalIfNeeded();
      await Brightness.setBrightnessAsync(value);
      setBrightnessState(value);
      setIsNightMode(value < 0.5);
      hasModifiedRef.current = true;
    } catch (error) {
      logger.error('Failed to set brightness', { error });
    }
  }, [saveOriginalIfNeeded]);

  const toggleBrightness = useCallback(async () => {
    try {
      if (!isNightMode) {
        await saveOriginalIfNeeded();
        await Brightness.setBrightnessAsync(0.3);
        setBrightnessState(0.3);
        setIsNightMode(true);
        hasModifiedRef.current = true;
        logger.info('Switched to night mode');
      } else {
        const restoreTo = originalBrightnessRef.current ?? 1;
        await Brightness.setBrightnessAsync(restoreTo);
        setBrightnessState(restoreTo);
        setIsNightMode(false);
        logger.info('Switched to day mode');
      }
    } catch (error) {
      logger.error('Failed to toggle brightness', { error });
    }
  }, [isNightMode, saveOriginalIfNeeded]);

  return {
    brightness,
    isNightMode,
    toggleBrightness,
    setBrightness,
  };
}
