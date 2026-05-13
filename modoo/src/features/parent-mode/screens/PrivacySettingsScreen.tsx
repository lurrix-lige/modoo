import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { ArrowLeft, Shield, ChevronRight, CheckCircle, Database, Lock, Eye, Bell } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles } from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { apiService } from '../../../services';
import { logger } from '../../../utils/logger';

type PrivacySettingsNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  personalizedRecommendations: boolean;
}

const privacyIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'database': Database,
  'bar-chart': Eye,
  'gift': Bell,
};

export default function PrivacySettingsScreen() {
  const navigation = useNavigation<PrivacySettingsNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [settings, setSettings] = useState<PrivacySettings>({
    dataCollection: true,
    analytics: true,
    personalizedRecommendations: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const savedSettings = await apiService.getPrivacySettings();
        setSettings(savedSettings);
      } catch (error) {
        logger.error('Failed to load privacy settings', { error });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleSetting = async (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    setLoading(true);
    try {
      await apiService.updatePrivacySettings(newSettings);
    } catch (error) {
      logger.error('Failed to update privacy settings', { error });
      setSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      t('privacy.exportData'),
      t('privacy.exportDataDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await apiService.exportUserData();
              Alert.alert(t('common.success'), t('privacy.exportSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('privacy.exportFailed'));
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('privacy.deleteAccount'),
      t('privacy.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('privacy.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAccount();
              Alert.alert(t('common.success'), t('privacy.deleteSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('privacy.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const renderToggleItem = (
    key: keyof PrivacySettings,
    title: string,
    description: string,
    iconName: string
  ) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          {(() => { const IconComp = privacyIconMap[iconName] || Shield; return <IconComp size={20} color={colors.primary} />; })()}
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={commonColors.white}
        disabled={loading}
      />
    </View>
  );

  const renderNavigationItem = (
    title: string,
    description: string,
    iconName: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          {(() => { const IconComp = privacyIconMap[iconName] || Shield; return <IconComp size={20} color={colors.primary} />; })()}
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
      <ChevronRight size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('settings.privacy')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.dataCollection')}
          </Text>
          {renderToggleItem(
            'dataCollection',
            t('settings.dataCollection'),
            t('settings.dataCollectionDesc'),
            'cloud-upload-outline'
          )}
          {renderToggleItem(
            'analytics',
            t('settings.analytics'),
            t('settings.analyticsDesc'),
            'bar-chart-outline'
          )}
          {renderToggleItem(
            'personalizedRecommendations',
            t('settings.personalizedRecommendations'),
            t('settings.personalizedRecommendationsDesc'),
            'sparkles-outline'
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.account')}
          </Text>
          {renderNavigationItem(
            t('privacy.exportData'),
            t('privacy.exportDataDesc'),
            'download-outline',
            handleExportData
          )}
          {renderNavigationItem(
            t('privacy.deleteAccount'),
            t('privacy.deleteAccountDesc'),
            'trash-outline',
            handleDeleteAccount
          )}
        </View>
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
  section: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  settingLeft: {
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
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: typography.fontSize.sm,
  },
});
