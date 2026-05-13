import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage, availableLanguages } from '../hooks/useLanguage';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/spacing';

interface LanguageSwitcherProps {
  horizontal?: boolean;
}

export function LanguageSwitcher({ horizontal = false }: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: horizontal ? 'row' : 'column',
      gap: spacing.md,
    },
    button: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      minWidth: horizontal ? 120 : '100%',
      alignItems: 'center',
    },
    activeButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    text: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    activeText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    nativeName: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    activeNativeName: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
  });

  return (
    <View style={styles.container}>
      {availableLanguages.map((lang) => {
        const isActive = lang.code === currentLanguage;
        
        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => changeLanguage(lang.code)}
            style={[styles.button, isActive && styles.activeButton]}
            activeOpacity={0.7}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {lang.nativeName}
            </Text>
            <Text style={[styles.nativeName, isActive && styles.activeNativeName]}>
              {lang.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}