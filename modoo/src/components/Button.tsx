import React, { ReactNode, useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { useTheme, spacing, borderRadius, typography, responsive } from '../theme';
import { authService } from '../services';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    if (authService.isAuthenticated()) {
      authService.recordActivity();
    }
    onPress();
  }, [onPress]);

  const buttonStyle = useMemo((): StyleProp<ViewStyle> => {
    const base: StyleProp<ViewStyle> = [styles.button];

    switch (variant) {
      case 'primary':
        base.push({
          backgroundColor: disabled ? colors.disabled : colors.primary,
        });
        break;
      case 'secondary':
        base.push({
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: disabled ? colors.disabled : colors.primary,
        });
        break;
      case 'text':
        base.push({
          backgroundColor: 'transparent',
        });
        break;
    }

    return base;
  }, [variant, disabled, colors.disabled, colors.primary]);

  const buttonTextStyle = useMemo((): StyleProp<TextStyle> => {
    const base: StyleProp<TextStyle> = [styles.text];

    switch (variant) {
      case 'primary':
        base.push({
          color: colors.textPrimary,
        });
        break;
      case 'secondary':
      case 'text':
        base.push({
          color: disabled ? colors.disabled : colors.textPrimary,
        });
        break;
    }

    return base;
  }, [variant, disabled, colors.disabled, colors.textPrimary]);

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon}
          {title && <Text style={[buttonTextStyle, textStyle]}>{title}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: responsive.verticalScale(48),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
});
