/**
 * 欢迎页面英雄区域组件
 * 
 * 展示应用 Logo 和欢迎信息，使用 GuardianSpirit 组件实现动画效果�? * 
 * @component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, typography, shadows, commonColors } from '../../theme';
import { useVisitTracker } from '../../hooks';
import GuardianSpirit from '../GuardianSpirit';

export function WelcomeHero() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isFirstVisit } = useVisitTracker();

  return (
    <View style={styles.container}>
      {/* 使用 GuardianSpirit 组件展示 Logo */}
      <GuardianSpirit
        icon="moon"
        size={120}
        color={colors.primary}
        innerColor={colors.primaryDark}
        iconSize={64}
        iconColor={commonColors.white}
        animationType="breathe"
        animationDuration={3000}
        style={styles.logo}
      />
      
      <Text style={[styles.appTitle, { color: colors.textPrimary }]}>
        {t('welcome.appTitle')}
      </Text>
      <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
        {isFirstVisit ? t('welcome.firstVisit') : t('welcome.returnVisit')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  logo: {
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  appTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
  },
});
