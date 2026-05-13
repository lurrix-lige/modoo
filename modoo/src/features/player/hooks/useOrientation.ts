import { useState, useCallback, useEffect, useRef } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { logger } from '../../../utils/logger';

export type OrientationType = 'portrait' | 'landscape-left' | 'landscape-right';

export interface UseOrientationReturn {
  isLandscape: boolean;
  orientation: OrientationType;
  isOrientationChanging: boolean;
  toggleOrientation: () => void;
  lockToPortrait: () => Promise<void>;
  lockToLandscape: () => Promise<void>;
}

/**
 * 处理屏幕方向相关的 Hook
 * 支持横竖屏切换、方向监听和锁定
 */
export function useOrientation(): UseOrientationReturn {
  const [isLandscape, setIsLandscape] = useState(false);
  const [orientation, setOrientation] = useState<OrientationType>('portrait');
  const [isOrientationChanging, setIsOrientationChanging] = useState(false);
  const lockRef = useRef<boolean>(false);

  /**
   * 将原生方向转换为应用内方向类型
   */
  const convertOrientation = useCallback((nativeOrientation: ScreenOrientation.Orientation): OrientationType => {
    switch (nativeOrientation) {
      case ScreenOrientation.Orientation.LANDSCAPE_LEFT:
        return 'landscape-left';
      case ScreenOrientation.Orientation.LANDSCAPE_RIGHT:
        return 'landscape-right';
      default:
        return 'portrait';
    }
  }, []);

  /**
   * 检查是否为横屏方向
   */
  const checkIsLandscape = useCallback((nativeOrientation: ScreenOrientation.Orientation): boolean => {
    return (
      nativeOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
      nativeOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
    );
  }, []);

  /**
   * 安全地执行方向操作，统一错误处理
   */
  const safeOrientationOperation = useCallback(
    async <T,>(operation: () => Promise<T>, errorMessage: string): Promise<T | undefined> => {
      try {
        return await operation();
      } catch (error) {
        logger.debug(`${errorMessage} (may need app rebuild)`, { error });
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
        } catch (resetError) {
          logger.debug('Failed to reset orientation', { resetError });
        }
        return undefined;
      }
    },
    []
  );

  useEffect(() => {
    /**
     * 初始化时获取当前方向
     */
    const checkOrientation = async () => {
      const result = await safeOrientationOperation(
        () => ScreenOrientation.getOrientationAsync(),
        'Failed to get orientation'
      );

      if (result !== undefined) {
        setOrientation(convertOrientation(result));
        setIsLandscape(checkIsLandscape(result));
      }
    };

    checkOrientation();

    /**
     * 监听系统方向变化
     */
    const subscription = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      if (!lockRef.current) {
        setOrientation(convertOrientation(orientationInfo.orientation));
        setIsLandscape(checkIsLandscape(orientationInfo.orientation));
      }
    });

    /**
     * 清理函数：移除监听器并重置方向
     */
    return () => {
      subscription.remove();
      safeOrientationOperation(
        () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT),
        'Failed to reset orientation on unmount'
      );
    };
  }, [convertOrientation, checkIsLandscape, safeOrientationOperation]);

  /**
   * 切换横竖屏
   * 根据设备当前方向智能选择左横屏或右横屏
   */
  const toggleOrientation = useCallback(async () => {
    if (isOrientationChanging) return;

    setIsOrientationChanging(true);
    lockRef.current = true;

    const newIsLandscape = !isLandscape;
    let targetLock: ScreenOrientation.OrientationLock;

    if (newIsLandscape) {
      // 根据当前方向智能选择左/右横屏
      targetLock =
        orientation === 'landscape-right'
          ? ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
          : ScreenOrientation.OrientationLock.LANDSCAPE_LEFT;
    } else {
      targetLock = ScreenOrientation.OrientationLock.PORTRAIT;
    }

    await safeOrientationOperation(async () => {
      await ScreenOrientation.lockAsync(targetLock);
      setIsLandscape(newIsLandscape);
      setOrientation(newIsLandscape ? (targetLock === ScreenOrientation.OrientationLock.LANDSCAPE_LEFT ? 'landscape-left' : 'landscape-right') : 'portrait');
      logger.info(`Orientation changed to ${newIsLandscape ? orientation : 'portrait'}`);
    }, 'Failed to change orientation');

    lockRef.current = false;
    setIsOrientationChanging(false);
  }, [isLandscape, isOrientationChanging, orientation, safeOrientationOperation]);

  /**
   * 锁定为竖屏
   */
  const lockToPortrait = useCallback(async () => {
    await safeOrientationOperation(async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      setIsLandscape(false);
      setOrientation('portrait');
    }, 'Failed to lock to portrait');
  }, [safeOrientationOperation]);

  /**
   * 锁定为横屏（自动选择方向）
   */
  const lockToLandscape = useCallback(async () => {
    await safeOrientationOperation(async () => {
      // 使用 LANDSCAPE 让系统自动选择左或右
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setIsLandscape(true);
      // 获取实际方向来更新状态
      const currentOrientation = await ScreenOrientation.getOrientationAsync();
      setOrientation(convertOrientation(currentOrientation));
    }, 'Failed to lock to landscape');
  }, [convertOrientation, safeOrientationOperation]);

  return {
    isLandscape,
    orientation,
    isOrientationChanging,
    toggleOrientation,
    lockToPortrait,
    lockToLandscape,
  };
}
