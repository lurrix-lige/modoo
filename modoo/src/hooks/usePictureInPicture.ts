import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

export interface UsePictureInPictureOptions {
  onEnterPiP?: () => void;
  onExitPiP?: () => void;
  onError?: (error: Error) => void;
}

export interface PictureInPictureState {
  isAvailable: boolean;
  isActive: boolean;
  startPiP: () => void;
  stopPiP: () => void;
  togglePiP: () => void;
}

const isPiPAvailable = () => {
  if (Platform.OS === 'ios') {
    const iosVersion = parseInt(Platform.Version.toString(), 10);
    return iosVersion >= 14;
  }
  if (Platform.OS === 'android') {
    const androidVersion = parseInt(Platform.Version.toString(), 10);
    return androidVersion >= 8;
  }
  return false;
};

export const usePictureInPicture = (options?: UsePictureInPictureOptions): PictureInPictureState => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setIsAvailable(isPiPAvailable());
  }, []);

  const startPiP = useCallback(async () => {
    if (!isAvailable) {
      const error = new Error('Picture-in-Picture is not available on this device');
      logger.warn('PiP not available');
      options?.onError?.(error);
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        logger.info('Attempting to enter PiP on iOS');
      } else if (Platform.OS === 'android') {
        logger.info('Attempting to enter PiP on Android');
      }

      setIsActive(true);
      options?.onEnterPiP?.();
      logger.info('Entered Picture-in-Picture mode');
    } catch (error) {
      logger.error('Failed to enter PiP mode', { error });
      options?.onError?.(error as Error);
    }
  }, [isAvailable, options]);

  const stopPiP = useCallback(async () => {
    if (!isActive) return;

    try {
      if (Platform.OS === 'ios') {
        logger.info('Attempting to exit PiP on iOS');
      } else if (Platform.OS === 'android') {
        logger.info('Attempting to exit PiP on Android');
      }

      setIsActive(false);
      options?.onExitPiP?.();
      logger.info('Exited Picture-in-Picture mode');
    } catch (error) {
      logger.error('Failed to exit PiP mode', { error });
      options?.onError?.(error as Error);
    }
  }, [isActive, options]);

  const togglePiP = useCallback(() => {
    if (isActive) {
      stopPiP();
    } else {
      startPiP();
    }
  }, [isActive, startPiP, stopPiP]);

  return {
    isAvailable,
    isActive,
    startPiP,
    stopPiP,
    togglePiP,
  };
};

export default usePictureInPicture;
