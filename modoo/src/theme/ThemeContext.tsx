

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { colors, ThemeColors } from './colors';
import { storageService } from '../services';
import { logger } from '../utils/logger';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeAction =
  | { type: 'SET_THEME_MODE'; payload: ThemeMode }
  | { type: 'SET_SYSTEM_THEME'; payload: 'light' | 'dark' };

interface ThemeState {
  themeMode: ThemeMode;
  systemTheme: 'light' | 'dark';
}

interface SemanticColors {
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
}

export interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  semanticColors: SemanticColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  systemTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME_MODE':
      return { ...state, themeMode: action.payload };
    case 'SET_SYSTEM_THEME':
      return { ...state, systemTheme: action.payload };
    default:
      return state;
  }
}

function getEffectiveTheme(
  themeMode: ThemeMode,
  systemTheme: 'light' | 'dark'
): 'light' | 'dark' {
  if (themeMode === 'system') {
    return systemTheme;
  }
  return themeMode;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme() || 'light';

  const initialState: ThemeState = {
    themeMode: 'system',
    systemTheme: (systemColorScheme === 'dark' ? 'dark' : 'light'),
  };

  const [state, dispatch] = useReducer(themeReducer, initialState);

  const isDark = useMemo(
    () => getEffectiveTheme(state.themeMode, state.systemTheme) === 'dark',
    [state.themeMode, state.systemTheme]
  );

  const themeColors: ThemeColors = useMemo(
    () => (isDark ? colors.dark : colors.light),
    [isDark]
  );

  const currentSemanticColors = useMemo(
    () => ({
      success: themeColors.success,
      successLight: themeColors.successLight,
      warning: themeColors.warning,
      warningLight: themeColors.warningLight,
      error: themeColors.error,
      errorLight: themeColors.errorLight,
      info: themeColors.info,
      infoLight: themeColors.infoLight,
    }),
    [themeColors]
  );

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      await storageService.saveThemeMode(mode);
      dispatch({ type: 'SET_THEME_MODE', payload: mode });
    } catch (error) {
      logger.error('Failed to save theme preference', { error });
    }
  }, []);

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedMode = await storageService.getThemeMode();
        if (savedMode) {
          dispatch({ type: 'SET_THEME_MODE', payload: savedMode });
        }
      } catch (error) {
        logger.error('Failed to load theme preference', { error });
      }
    };

    loadSavedTheme();
  }, []);

  useEffect(() => {
    dispatch({
      type: 'SET_SYSTEM_THEME',
      payload: systemColorScheme === 'dark' ? 'dark' : 'light'
    });
  }, [systemColorScheme]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const newSystemTheme = colorScheme || 'light';
      dispatch({
        type: 'SET_SYSTEM_THEME',
        payload: newSystemTheme as 'light' | 'dark'
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const value = useMemo(
    () => ({
      isDark,
      colors: themeColors,
      semanticColors: currentSemanticColors,
      themeMode: state.themeMode,
      setThemeMode,
      systemTheme: state.systemTheme,
    }),
    [
      isDark,
      themeColors,
      currentSemanticColors,
      state.themeMode,
      setThemeMode,
      state.systemTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * 主题切换钩子
 * 提供更精细的主题控制能力
 */
export function useThemeToggle() {
  const { themeMode, setThemeMode, isDark } = useTheme();

  const cycleThemeMode = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  }, [themeMode, setThemeMode]);

  return {
    themeMode,
    isDark,
    setThemeMode,
    cycleThemeMode,
    isSystem: themeMode === 'system',
    isLight: themeMode === 'light',
    isDarkMode: themeMode === 'dark',
  };
}

/**
 * 颜色对比度计算工�? * 用于验证WCAG对比度标�? */
export function getContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const luminance1 = getLuminance(foreground);
  const luminance2 = getLuminance(background);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): number[] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ]
    : null;
}

/**
 * WCAG 对比度验证工�? */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (isLargeText) {
    return level === 'AA' ? ratio >= 3 : ratio >= 4.5;
  }
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}
