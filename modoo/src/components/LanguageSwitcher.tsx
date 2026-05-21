import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useLanguage, availableLanguages } from '../hooks/useLanguage';
import { useTheme, typography, responsive } from '../theme';
import { spacing } from '../theme/spacing';

interface LanguageSwitcherProps {
  horizontal?: boolean;
}

export function LanguageSwitcher({ horizontal = false }: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    activeButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    activeNativeName: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
    activeText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    button: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      minWidth: horizontal ? 120 : '100%',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    container: {
      flexDirection: horizontal ? 'row' : 'column',
      gap: spacing.md,
    },
    nativeName: {
      color: colors.textSecondary,
      fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    },
    text: {
      color: colors.textPrimary,
      fontSize: responsive.scaledFontSize(typography.fontSize.lg),
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
            <Text style={[styles.text, isActive && styles.activeText]}>{lang.nativeName}</Text>
            <Text style={[styles.nativeName, isActive && styles.activeNativeName]}>
              {lang.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
