import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const isTablet = screenWidth >= 768;
  const isLandscape = screenWidth > screenHeight;
  const isSmallDevice = screenWidth < 375;
  const isLargeDevice = screenWidth >= 414;

  const getContentCardWidth = useCallback(() => {
    if (isTablet) return `${31}%`;
    if (isLandscape) return `${31}%`;
    return `${48}%`;
  }, [isTablet, isLandscape]);

  const getGridColumns = useCallback(() => {
    if (isTablet) return 3;
    if (isLandscape) return 3;
    return 2;
  }, [isTablet, isLandscape]);

  const getContentLimit = useCallback(() => {
    if (isTablet) return 6;
    return 4;
  }, [isTablet]);

  const getSpacingSize = useCallback(() => {
    if (isTablet) return 'xl';
    if (isLargeDevice) return 'lg';
    return 'md';
  }, [isTablet, isLargeDevice]);

  return {
    screenWidth,
    screenHeight,
    isTablet,
    isLandscape,
    isSmallDevice,
    isLargeDevice,
    getContentCardWidth,
    getGridColumns,
    getContentLimit,
    getSpacingSize,
  };
}
