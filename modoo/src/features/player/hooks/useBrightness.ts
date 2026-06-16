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
  const originalBrightnessRef = useRef(1);
  const hasModifiedRef = useRef(false);

  const setBrightness = useCallback(async (value: number) => {
    try {
      await Brightness.setBrightnessAsync(value);
      setBrightnessState(value);
      setIsNightMode(value < 0.5);
      hasModifiedRef.current = true;
    } catch (error) {
      logger.error('Failed to set brightness', { error });
    }
  }, []);

  const toggleBrightness = useCallback(async () => {
    try {
      if (!isNightMode) {
        originalBrightnessRef.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(0.3);
        setBrightnessState(0.3);
        setIsNightMode(true);
        hasModifiedRef.current = true;
        logger.info('Switched to night mode');
      } else {
        await Brightness.setBrightnessAsync(originalBrightnessRef.current);
        setBrightnessState(originalBrightnessRef.current);
        setIsNightMode(false);
        logger.info('Switched to day mode');
      }
    } catch (error) {
      logger.error('Failed to toggle brightness', { error });
    }
  }, [isNightMode]);

  useEffect(() => {
    return () => {
      if (hasModifiedRef.current) {
        Brightness.setBrightnessAsync(originalBrightnessRef.current).catch(() => {});
      }
    };
  }, []);

  return {
    brightness,
    isNightMode,
    toggleBrightness,
    setBrightness,
  };
}
