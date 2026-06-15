import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CheckCircle,
  Moon,
  Calendar,
  Eye,
  User,
  Star,
  MessageCircle,
  Gift,
} from 'lucide-react-native';
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
import { userApi } from '../../../infrastructure/api';
import { ErrorToast } from '../../../components';
import { logger } from '../../../utils/logger';

type NotificationSettingsNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

interface NotificationSettings {
  sleepReminder: boolean;
  checkInReminder: boolean;
  reportNotification: boolean;
  expertReminder: boolean;
  activityReminder: boolean;
}

interface NotificationError {
  visible: boolean;
  message: string;
  code?: string;
}

const notificationIconMap: Record<string, any> = {
  'moon-outline': Moon,
  'calendar-outline': Calendar,
  'document-text-outline': Eye,
  'person-outline': User,
  'bulb-outline': Star,
  'checkmark-circle-outline': CheckCircle,
  'chatbubbles-outline': MessageCircle,
  'gift-outline': Gift,
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NotificationSettingsNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [settings, setSettings] = useState<NotificationSettings>({
    sleepReminder: true,
    checkInReminder: true,
    reportNotification: true,
    expertReminder: false,
    activityReminder: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NotificationError>({ visible: false, message: '' });

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const savedSettings = await userApi.getNotificationSettings();
        setSettings(savedSettings);
      } catch (err) {
        logger.error('Failed to load notification settings', { error: err });
        setError({ visible: true, message: t('common.loadFailed') });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleSetting = async (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    setLoading(true);
    try {
      await userApi.updateNotificationSettings(newSettings);
    } catch (err) {
      logger.error('Failed to update notification settings', { error: err });
      setSettings(settings);
      setError({ visible: true, message: t('common.loadFailed') });
    } finally {
      setLoading(false);
    }
  };

  const renderSettingItem = (
    key: keyof NotificationSettings,
    title: string,
    description: string,
    iconName: string,
  ) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          {(() => {
            const IconComp = notificationIconMap[iconName] || Bell;
            return <IconComp size={20} color={colors.primary} />;
          })()}
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

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('settings.notifications')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.sleepReminder')}
          </Text>
          {renderSettingItem(
            'sleepReminder',
            t('settings.sleepReminder'),
            t('settings.sleepReminderDesc'),
            'moon-outline',
          )}
          {renderSettingItem(
            'checkInReminder',
            t('settings.checkInReminder'),
            t('settings.checkInReminderDesc'),
            'checkmark-circle-outline',
          )}
          {renderSettingItem(
            'reportNotification',
            t('settings.reportNotification'),
            t('settings.reportNotificationDesc'),
            'document-text-outline',
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.serviceNotification')}
          </Text>
          {renderSettingItem(
            'expertReminder',
            t('settings.expertReminder'),
            t('settings.expertReminderDesc'),
            'chatbubbles-outline',
          )}
          {renderSettingItem(
            'activityReminder',
            t('settings.activityReminder'),
            t('settings.activityReminderDesc'),
            'gift-outline',
          )}
        </View>

        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {t('settings.notificationFooter')}
        </Text>
      </ScrollView>

      <ErrorToast
        visible={error.visible}
        message={error.message}
        code={error.code}
        severity="error"
        duration={5000}
        onDismiss={() => setError({ visible: false, message: '' })}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing.xl,
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
  section: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  settingContent: {
    flex: 1,
  },
  settingDesc: {
    fontSize: typography.fontSize.sm,
  },
  settingItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
});
