import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function useResponsive() {
  const isTablet = SCREEN_WIDTH >= 768;
  const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
  const isSmallDevice = SCREEN_WIDTH < 375;
  const isLargeDevice = SCREEN_WIDTH >= 414;

  const getContentCardWidth = () => {
    if (isTablet) return `${31}%`;
    if (isLandscape) return `${31}%`;
    return `${48}%`;
  };

  const getGridColumns = () => {
    if (isTablet) return 3;
    if (isLandscape) return 3;
    return 2;
  };

  const getContentLimit = () => {
    if (isTablet) return 6;
    return 4;
  };

  const getSpacingSize = () => {
    if (isTablet) return 'xl';
    if (isLargeDevice) return 'lg';
    return 'md';
  };

  return {
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
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
