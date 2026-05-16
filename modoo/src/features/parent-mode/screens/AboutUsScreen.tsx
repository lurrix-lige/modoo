import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaContainer, Logo } from '../../../components';
import { ArrowLeft, Globe, Mail, Star, ExternalLink, ChevronRight } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles } from '../../../theme';
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
    Linking.openURL('mailto:support@dozoo.com');
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://www.dozoo.com');
  };

  const handleRateApp = () => {
    Linking.openURL('https://apps.apple.com/app/dozoo');
  };

  const renderNavItem = (
    title: string,
    subtitle: string,
    iconName: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.navItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.navLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          {(() => { const IconComp = aboutIconMap[iconName] || Mail;
             return <IconComp size={20} color={colors.primary} />; })()}
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
          <Text style={[styles.slogan, { color: colors.textSecondary }]}>
            {t('auth.subtitle')}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderNavItem(
            t('about.contactSupport'),
            t('about.contactSupportDesc'),
            'headset-outline',
            handleContactSupport
          )}
          {renderNavItem(
            t('about.visitWebsite'),
            'www.dozoo.com',
            'globe-outline',
            handleVisitWebsite
          )}
          {renderNavItem(
            t('about.rateApp'),
            t('about.rateAppDesc'),
            'star-outline',
            handleRateApp
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('about.company')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('about.companyName')}
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {t('about.companyNameValue')}
            </Text>
          </View>
          <View style={styles.infoItem}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  logoCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  slogan: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  section: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.small,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  navContent: {
    flex: 1,
  },
  navTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  navSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  infoLabel: {
    fontSize: typography.fontSize.md,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  copyright: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  rights: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
});
