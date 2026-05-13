import { Dimensions, Platform, PixelRatio, ScaledSize } from 'react-native';

let windowDimensions = Dimensions.get('window');
let screenWidth = windowDimensions.width;
let screenHeight = windowDimensions.height;

const standardWidth = 375;
const standardHeight = 812;

const scale = (size: number) => (screenWidth / standardWidth) * size;

const verticalScale = (size: number) => (screenHeight / standardHeight) * size;

const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

const responsiveWidth = (percentage: number) => (screenWidth * percentage) / 100;

const responsiveHeight = (percentage: number) => (screenHeight * percentage) / 100;

// Enhanced screen size breakpoints
const isXSmallScreen = screenWidth < 320;
const isSmallScreen = screenWidth >= 320 && screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth <= 414;
const isLargePhone = screenWidth > 414 && screenWidth < 768;
const isLargeScreen = screenWidth > 414;
const isTablet = screenWidth >= 768;

// Tablet-specific breakpoints
const isSmallTablet = screenWidth >= 768 && screenWidth < 1024;
const isMediumTablet = screenWidth >= 1024 && screenWidth < 1366;
const isLargeTablet = screenWidth >= 1366;

// Desktop/web breakpoints
const isSmallDesktop = screenWidth >= 1366 && screenWidth < 1920;
const isLargeDesktop = screenWidth >= 1920;

// Orientation detection
const isPortrait = screenHeight > screenWidth;
const isLandscape = screenWidth > screenHeight;
const isTabletInLandscape = isTablet && isLandscape;

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
const isWeb = Platform.OS === 'web';

const getFontScale = () => PixelRatio.getFontScale();

const scaledFontSize = (size: number) => {
  const fontScale = getFontScale();
  return moderateScale(size, 0.4) * fontScale;
};

const getSpacing = (size: number) => {
  if (isXSmallScreen) {
    return size * 0.75;
  }
  if (isSmallScreen) {
    return size * 0.85;
  }
  if (isLargePhone || isTablet) {
    return size * 1.15;
  }
  if (isLargeDesktop) {
    return size * 1.3;
  }
  return size;
};

// Get max content width for centered layouts on large screens
const getMaxContentWidth = () => {
  if (isLargeDesktop) return 1400;
  if (isSmallDesktop) return 1200;
  if (isLargeTablet) return 1200;
  if (isMediumTablet) return 900;
  if (isSmallTablet) return 700;
  return screenWidth;
};

// Dynamic update of window dimensions
const updateWindowDimensions = (dimensions: { window: ScaledSize }) => {
  windowDimensions = dimensions.window;
  screenWidth = windowDimensions.width;
  screenHeight = windowDimensions.height;
};

export const responsive = {
  scale,
  verticalScale,
  moderateScale,
  responsiveWidth,
  responsiveHeight,
  scaledFontSize,
  getSpacing,
  getMaxContentWidth,
  updateWindowDimensions,
  
  // Screen size flags
  isXSmallScreen,
  isSmallScreen,
  isMediumScreen,
  isLargePhone,
  isLargeScreen,
  
  // Tablet flags
  isTablet,
  isSmallTablet,
  isMediumTablet,
  isLargeTablet,
  isTabletInLandscape,
  
  // Desktop flags
  isSmallDesktop,
  isLargeDesktop,
  
  // Orientation flags
  isPortrait,
  isLandscape,
  
  // Platform flags
  isIOS,
  isAndroid,
  isWeb,
  
  // Dimensions
  screenWidth,
  screenHeight,
  standardWidth,
  standardHeight,
};