import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaContainer, Logo } from '../../../components';
import { ArrowLeft, Globe, Mail, Star, ChevronRight } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonColors,
  sharedStyles,
} from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { APP_CONFIG } from '../../../config/env';

type AboutUsNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

const aboutIconMap: Record<string, any> = {
  'globe-outline': Globe,
  'mail-outline': Mail,
  'star-outline': Star,
  'chevron-forward': ChevronRight,
};

export default function AboutUsScreen() {
  const navigation = useNavigation<AboutUsNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${APP_CONFIG.SUPPORT_EMAIL}`);
  };

  const handleVisitWebsite = () => {
    Linking.openURL(APP_CONFIG.WEBSITE_URL);
  };

  const handleRateApp = () => {
    Linking.openURL(APP_CONFIG.APP_STORE_URL);
  };

  const renderNavItem = (
    title: string,
    subtitle: string,
    iconName: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      style={[styles.navItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.navLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          {(() => {
            const IconComp = aboutIconMap[iconName] || Mail;
            return <IconComp size={20} color={colors.primary} />;
          })()}
        </View>
        <View style={styles.navContent}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('settings.about')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.logoCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Logo />
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>{t('auth.title')}</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            {t('common.version')} {APP_CONFIG.VERSION} ({APP_CONFIG.BUILD_NUMBER})
          </Text>
          <Text style={[styles.slogan, { color: colors.textSecondary }]}>{t('auth.subtitle')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderNavItem(
            t('about.contactSupport'),
            t('about.contactSupportDesc'),
            'headset-outline',
            handleContactSupport,
          )}
          {renderNavItem(
            t('about.visitWebsite'),
            t('about.visitWebsiteUrl'),
            'globe-outline',
            handleVisitWebsite,
          )}
          {renderNavItem(t('about.rateApp'), t('about.rateAppDesc'), 'star-outline', handleRateApp)}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('about.company')}
            </Text>
          </View>
          <View style={styles.infoItemBlock}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('about.companyName')}
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {t('about.companyNameValue')}
            </Text>
          </View>
          <View style={styles.infoItemBlock}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('about.businessLicense')}
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {t('about.businessLicenseValue')}
            </Text>
          </View>
        </View>

        <Text style={[styles.copyright, { color: colors.textSecondary }]}>
          ©2024-2026 {t('about.companyNameValue')}
        </Text>
        <Text style={[styles.rights, { color: colors.textSecondary }]}>
          {t('about.allRightsReserved')}
        </Text>
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  appName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  backButton: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  copyright: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  infoItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoItemBlock: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.fontSize.md,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  logoCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    ...shadows.medium,
  },
  logoContainer: {
    alignItems: 'center',
    borderRadius: 24,
    height: 96,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 96,
  },
  navContent: {
    flex: 1,
  },
  navItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  navSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  navTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  rights: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xxl,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.small,
  },
  sectionHeader: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
  },
  slogan: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  version: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
});
