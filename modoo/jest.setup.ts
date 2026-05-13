// Mock native modules that babel-jest can't transform

// React Native globals
(global as Record<string, unknown>).__DEV__ = true;

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios },
  AppState: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
  NativeModules: {},
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
  AudioPlayer: {},
  AudioStatus: {},
}));

jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((val) => ({ value: val })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((val) => val),
  withSpring: jest.fn((val) => val),
  default: {
    createAnimatedComponent: (component: unknown) => component,
  },
}));

jest.mock('react-native-gesture-handler', () => ({}));

jest.mock('lucide-react-native', () => ({}));

jest.mock('react-native-svg', () => ({}));

jest.mock('@react-native-async-storage/async-storage', () => ({}));

jest.mock('expo-font', () => ({}));
