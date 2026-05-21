import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { RefreshCw, CloudOff } from 'lucide-react-native';
import { useTheme, spacing, borderRadius, typography, commonColors } from '../theme';
import { useHealthStore } from '../services/HealthCheckService';
import { useTranslation } from 'react-i18next';

interface ConnectionStatusProps {
  visible?: boolean;
}

export const ConnectionStatus = ({ visible = true }: ConnectionStatusProps) => {
  const { connectionStatus } = useHealthStore();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const fadeAnim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  const textColor = useMemo(() => {
    return commonColors.white;
  }, []);

  const subtextColor = useMemo(() => {
    return isDark ? colors.textSecondary : commonColors.white;
  }, [isDark, colors.textSecondary]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  if (connectionStatus === 'online' || !visible) {
    return null;
  }

  const config = {
    checking: {
      icon: 'refresh-circle' as const,
      backgroundColor: colors.warning,
      text: t('connection.checking'),
      subtext: t('connection.checkingSubtext'),
    },
    offline: {
      icon: 'cloud-offline' as const,
      backgroundColor: colors.error,
      text: t('connection.offline'),
      subtext: t('connection.offlineSubtext'),
    },
  };

  const currentConfig = config[connectionStatus] || config.offline;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: currentConfig.backgroundColor },
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.icon}>
        {currentConfig.icon === 'refresh-circle' ? (
          <RefreshCw size={18} color={colors.primary} />
        ) : (
          <CloudOff size={18} color={colors.primary} />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.text, { color: textColor }]}>{currentConfig.text}</Text>
        <Text style={[styles.subtext, { color: subtextColor }]}>{currentConfig.subtext}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  subtext: {
    fontSize: typography.fontSize.xs,
  },
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  textContainer: {
    flex: 1,
  },
});

export default ConnectionStatus;
