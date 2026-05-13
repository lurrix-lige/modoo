import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import {
  Sun,
  Moon,
  Smartphone,
  Globe,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, commonColors } from '../theme';
import { useThemeToggle } from '../theme/ThemeContext';
import { useLanguage, availableLanguages, LanguageOption } from '../hooks/useLanguage';

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  sun: Sun,
  moon: Moon,
  smartphone: Smartphone,
};

export function SettingsPopover() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { themeMode, setThemeMode, cycleThemeMode } = useThemeToggle();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isOpen]);

  const getCurrentThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Smartphone;
      default:
        return Sun;
    }
  };

  const ThemeIcon = getCurrentThemeIcon();

  const currentLanguageInfo = availableLanguages.find(
    (lang) => lang.code === currentLanguage
  ) || availableLanguages[0];

  const themeOptions = [
    {
      mode: 'light' as const,
      icon: Sun,
      label: t('common.lightMode'),
    },
    {
      mode: 'dark' as const,
      icon: Moon,
      label: t('common.darkMode'),
    },
    {
      mode: 'system' as const,
      icon: Smartphone,
      label: t('common.systemMode'),
    },
  ];

  const handleThemeSelect = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    setIsOpen(false);
  };

  const handleLanguageSelect = (code: string) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
        accessibilityLabel={`${t('settings.themeAndLanguage')}`}
        accessibilityRole="button"
      >
        <ThemeIcon size={32} color={colors.textPrimary} />
        <ChevronDown size={14} color={colors.textSecondary} style={styles.chevron} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <Animated.View
            style={[
              styles.popoverContainer,
              {
                backgroundColor: colors.surface,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
                    <ThemeIcon size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    {t('settings.themeMode')}
                  </Text>
                </View>
                <View style={styles.optionsRow}>
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = themeMode === option.mode;
                    return (
                      <TouchableOpacity
                        key={option.mode}
                        style={[
                          styles.optionButton,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => handleThemeSelect(option.mode)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Icon
                          size={18}
                          color={isSelected ? commonColors.white : colors.textPrimary}
                        />
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: isSelected ? commonColors.white : colors.textPrimary },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Check size={14} color={commonColors.white} style={styles.checkIcon} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.secondaryLight }]}>
                    <Globe size={16} color={colors.secondary} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    {t('settings.language')}
                  </Text>
                </View>
                <View style={styles.optionsRow}>
                  {availableLanguages.map((lang) => {
                    const isSelected = currentLanguage === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        style={[
                          styles.optionButton,
                          {
                            backgroundColor: isSelected ? colors.secondary : colors.surfaceVariant,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => handleLanguageSelect(lang.code)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: isSelected ? commonColors.white : colors.textPrimary },
                          ]}
                        >
                          {lang.nativeName}
                        </Text>
                        {isSelected && (
                          <Check size={14} color={commonColors.white} style={styles.checkIcon} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  chevron: {
    marginLeft: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  popoverContainer: {
    width: 280,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minWidth: 80,
  },
  optionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
});
