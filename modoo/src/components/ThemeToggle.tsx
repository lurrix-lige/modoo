/**
 * Dozoo 主题切换组件
 *
 * 功能特性：
 * - 提供直观的主题切换控制
 * - 显示当前主题状态图标
 * - 支持点击循环切换主题模式
 * - 自动适应主题样式
 *
 * 使用方法：
 * ```tsx
 * import { ThemeToggle } from '../components';
 * <ThemeToggle />
 * ```
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sun, Moon, Smartphone } from 'lucide-react-native';

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'sunny': Sun,
  'moon': Moon,
  'system': Smartphone,
};
import { useTranslation } from 'react-i18next';
import { useTheme, useThemeToggle, responsive, typography } from '../theme';

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 24 }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { themeMode, cycleThemeMode } = useThemeToggle();

  const getIconName = (): string => {
    switch (themeMode) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'system':
        return 'phone-portrait';
      default:
        return 'sunny';
    }
  };

  return (
    <TouchableOpacity
      onPress={cycleThemeMode}
      style={styles.container}
      activeOpacity={0.7}
      accessibilityLabel={`${t('settings.themeMode')}: ${themeMode === 'light' ? t('common.lightMode') : themeMode === 'dark' ? t('common.darkMode') : t('common.systemMode')}`}
      accessibilityHint={t('themeToggle.accessibilityHint') || '点击可在日间模式、夜间模式和跟随系统之间循环切换'}
    >
      {(() => { const IconComp = iconMap[getIconName()] || Sun; return <IconComp size={size} color={colors.textPrimary} />; })()}
    </TouchableOpacity>
  );
}

interface ThemeSwitcherProps {
  onModeChange?: (mode: 'light' | 'dark' | 'system') => void;
}

export function ThemeSwitcher({ onModeChange }: ThemeSwitcherProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { themeMode, setThemeMode } = useThemeToggle();

  const options = [
    { mode: 'light' as const, icon: 'sunny', labelKey: 'common.lightMode' },
    { mode: 'dark' as const, icon: 'moon', labelKey: 'common.darkMode' },
    { mode: 'system' as const, icon: 'system', labelKey: 'common.systemMode' },
  ];

  const handlePress = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    onModeChange?.(mode);
  };

  return (
    <View style={styles.switcherContainer}>
      {options.map((option) => {
        const isSelected = themeMode === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            onPress={() => handlePress(option.mode)}
            style={[
              styles.switcherButton,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            {(() => { const IconComp = iconMap[option.icon] || Sun; return <IconComp size={18} color={isSelected ? colors.surface : colors.textPrimary} />; })()}
            <Text
              style={[
                styles.switcherLabel,
                {
                  color: isSelected ? colors.surface : colors.textPrimary,
                },
              ]}
            >
              {t(option.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
  },
  switcherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  switcherLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    marginLeft: 4,
    fontWeight: '500',
  },
});
