import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { ArrowLeft, Palette, ChevronRight, Globe, Check, FileText, ShieldCheck, Sun, Moon, Smartphone } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../hooks/useLanguage';
import { useTheme, spacing, borderRadius, typography, commonColors, sharedStyles, responsive, iconSizes } from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';

type SettingsScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'Settings'>;

const settingsIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'sunny': Sun,
  'moon': Moon,
  'phone-portrait': Smartphone,
};

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { colors, themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  const getThemeOptions = () => [
    { mode: 'light' as const, icon: 'sunny', label: t('settings.lightMode'), description: t('settings.lightModeDesc') },
    { mode: 'dark' as const, icon: 'moon', label: t('settings.darkMode'), description: t('settings.darkModeDesc') },
    { mode: 'system' as const, icon: 'phone-portrait', label: t('settings.systemMode'), description: t('settings.systemModeDesc') },
  ];

  const getCurrentThemeLabel = () => {
    const current = getThemeOptions().find(opt => opt.mode === themeMode);
    return current?.label || t('settings.lightMode');
  };

  const getCurrentLanguageLabel = () => {
    const current = availableLanguages.find(lang => lang.code === currentLanguage);
    return current?.nativeName || t('settings.chinese');
  };

  const handleThemePress = () => {
    const currentIndex = getThemeOptions().findIndex(opt => opt.mode === themeMode);
    const nextIndex = (currentIndex + 1) % getThemeOptions().length;
    setThemeMode(getThemeOptions()[nextIndex].mode);
  };

  const handleThemeSelect = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  const handleLanguagePress = () => {
    const currentIndex = availableLanguages.findIndex(lang => lang.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    changeLanguage(availableLanguages[nextIndex].code);
  };

  const handleUserAgreement = () => {
    Linking.openURL('https://www.dozoo.com/terms');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://www.dozoo.com/privacy');
  };

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={responsive.moderateScaleForIcon(iconSizes.lg)} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.displaySettings')}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={handleThemePress}
            >
              <View style={styles.settingLeft}>
                <Palette size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  {t('settings.themeMode')}
                </Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                  {getCurrentThemeLabel()}
                </Text>
                <ChevronRight size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleLanguagePress}
            >
              <View style={styles.settingLeft}>
                <Globe size={responsive.moderateScaleForIcon(iconSizes.lg)} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  {t('settings.language')}
                </Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                  {getCurrentLanguageLabel()}
                </Text>
                <ChevronRight size={responsive.moderateScaleForIcon(iconSizes.lg)} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.themePreview')}
          </Text>
          <View style={styles.themePreviewContainer}>
            {getThemeOptions().map((theme) => (
              <TouchableOpacity
                key={theme.mode}
                style={[
                  styles.themePreviewCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: themeMode === theme.mode ? colors.primary : colors.border,
                    borderWidth: themeMode === theme.mode ? 2 : 1,
                  },
                ]}
                onPress={() => handleThemeSelect(theme.mode)}
              >
                <View style={styles.themePreviewIcon}>
                  {(() => { const IconComp = settingsIconMap[theme.icon] || Palette; return <IconComp size={responsive.moderateScaleForIcon(iconSizes.xl)} color={themeMode === theme.mode ? colors.primary : colors.textSecondary} />; })()}
                </View>
                <Text
                  style={[
                    styles.themePreviewLabel,
                    { color: themeMode === theme.mode ? colors.primary : colors.textPrimary },
                  ]}
                >
                  {theme.label}
                </Text>
                <Text style={[styles.themePreviewDesc, { color: colors.textSecondary }]}>
                  {theme.description}
                </Text>
                {themeMode === theme.mode && (
                  <View style={[styles.themeSelectedBadge, { backgroundColor: colors.primary }]}>
                    <Check size={responsive.moderateScaleForIcon(iconSizes.sm)} color={commonColors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.legal')}
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={handleUserAgreement}
            >
              <View style={styles.settingLeft}>
                <FileText size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  {t('settings.userAgreement')}
                </Text>
              </View>
              <ChevronRight size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handlePrivacyPolicy}
            >
              <View style={styles.settingLeft}>
                <ShieldCheck size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  {t('settings.privacyPolicy')}
                </Text>
              </View>
              <ChevronRight size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginLeft: spacing.md,
  },
  settingValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginRight: spacing.xs,
  },
  themePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  themePreviewCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  themePreviewIcon: {
    marginBottom: spacing.sm,
  },
  themePreviewLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  themePreviewDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    textAlign: 'center',
  },
  themeSelectedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: responsive.moderateScale(20),
    height: responsive.moderateScale(20),
    borderRadius: responsive.moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
