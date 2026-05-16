import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { User, Settings, Bell, Lock, Info, ChevronRight, Baby, ArrowRight, LogOut, CalendarCheck } from 'lucide-react-native';

const profileIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'person-outline': User,
  'settings-outline': Settings,
  'notifications-outline': Bell,
  'lock-closed-outline': Lock,
  'information-circle-outline': Info,
  'calendar-outline': Baby,
  'check-in': CalendarCheck,
};
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles, responsive, iconSizes } from '../../../theme';
import { useAppStore } from '../../../store';
import { ParentStackParamList } from '../../../navigation/types';
import { ErrorToast } from '../../../components';
import { apiService, authService } from '../../../services';
import { errorHandler } from '../../../services/ErrorHandler';
import { normalizeSleepProblems, parseGender, parseGuardianIP } from '../../../utils/childProfile';
import { logger } from '../../../utils/logger';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

const MENU_ITEMS = [
  {
    id: 'child',
    titleKey: 'profile.childProfile',
    icon: 'person-outline',
    navigateTo: 'ChildProfile',
  },
  {
    id: 'checkIn',
    titleKey: 'profile.checkIn',
    icon: 'check-in',
    navigateTo: 'ParentCheckIn',
  },
  {
    id: 'expertBookings',
    titleKey: 'profile.expertBookings',
    icon: 'calendar-outline',
    navigateTo: 'ExpertBookings',
  },
  {
    id: 'settings',
    titleKey: 'settings.title',
    icon: 'settings-outline',
    navigateTo: 'Settings',
  },
  {
    id: 'notification',
    titleKey: 'profile.notificationSettings',
    icon: 'notifications-outline',
    navigateTo: 'NotificationSettings',
  },
  {
    id: 'privacy',
    titleKey: 'profile.privacySettings',
    icon: 'lock-closed-outline',
    navigateTo: 'PrivacySettings',
  },
  {
    id: 'about',
    titleKey: 'profile.aboutUs',
    icon: 'information-circle-outline',
    navigateTo: 'AboutUs',
  },
];

interface ProfileError {
  visible: boolean;
  message: string;
  code?: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { child, switchToChildMode, logout } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<ProfileError>({
    visible: false,
    message: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setProfileError({ visible: false, message: '' });
    try {
      const profileData = await apiService.getUserProfile();
      logger.debug('Profile loaded', { profileData });
    } catch (error) {
      logger.error('Failed to load profile', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setProfileError({ visible: false, message: '' });
    loadProfile();
  };

  const handleDismissError = () => {
    setProfileError({ visible: false, message: '' });
  };

  const handleChildProfilePress = async () => {
    try {
      const existingChild = await apiService.getChildProfile();
      existingChild && navigation.navigate('ChildProfile', {
        mode: 'view',
        source: 'parent',
        initialData: {
          id: existingChild.id,
          nickname: existingChild.nickname,
          birthday: existingChild.birthday,
          gender: parseGender(existingChild.gender),
          guardianIP: parseGuardianIP(existingChild.guardianIP),
          sleepProblems: normalizeSleepProblems(existingChild.sleepProblems),
        },
      });
      !existingChild && navigation.navigate('ChildProfile', { mode: 'create', source: 'parent' });
    } catch (error) {
      navigation.navigate('ChildProfile', { mode: 'create', source: 'parent' });
    }
  };

  const handleMenuPress = (item: typeof MENU_ITEMS[0]) => {
    if (item.id === 'child') {
      handleChildProfilePress();
    } else if (item.navigateTo) {
      navigation.navigate(item.navigateTo as 'Settings' | 'NotificationSettings' | 'PrivacySettings' | 'AboutUs' | 'ParentCheckIn' | 'ExpertBookings');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              logout();
              errorHandler.navigateToHome();
            } catch (error) {
              logger.error('Logout error', { error });
              logout();
              errorHandler.navigateToHome();
            }
          },
        },
      ]
    );
  };

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
      </View>

      <View style={[styles.skeletonProfileCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
        <View style={styles.skeletonProfileInfo}>
          <View style={[styles.skeletonNickname, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonBadge, { backgroundColor: colors.border }]} />
        </View>
      </View>

      <View style={[styles.skeletonChildModeCard, { backgroundColor: colors.primary }]}>
        <View style={styles.skeletonChildModeContent}>
          <View style={[styles.skeletonChildModeIcon, { backgroundColor: colors.primaryLight }]} />
          <View style={styles.skeletonChildModeText}>
            <View style={[styles.skeletonChildModeTitle, { backgroundColor: colors.primaryLight }]} />
            <View style={[styles.skeletonChildModeDesc, { backgroundColor: colors.primaryLight }]} />
          </View>
        </View>
      </View>

      <View style={[styles.skeletonMenuSection, { backgroundColor: colors.surface }]}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.skeletonMenuItem}>
            <View style={[styles.skeletonMenuIcon, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonMenuText, { backgroundColor: colors.border }]} />
          </View>
        ))}
      </View>

      <View style={[styles.skeletonLogoutButton, { backgroundColor: colors.surface }]} />
    </View>
  );

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('profile.title')}</Text>
        </View>

        {isLoading ? (
          renderLoadingSkeleton()
        ) : (
          <>
            <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <User size={responsive.moderateScaleForIcon(iconSizes.xxl)} color={commonColors.white} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.nickname, { color: colors.textPrimary }]}>
                  {child?.nickname || t('profile.defaultNickname')}
                </Text>
                <Text style={[styles.badge, { color: colors.textSecondary }]}>
                  {t('profile.membershipBadge')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => {}}>
                <ChevronRight size={responsive.moderateScaleForIcon(iconSizes.lg)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.childModeCard, { backgroundColor: colors.primary }]}
              onPress={switchToChildMode}
            >
              <View style={styles.childModeContent}>
                <Baby size={responsive.moderateScaleForIcon(iconSizes.xl)} color={commonColors.white} />
                <View style={styles.childModeText}>
                  <Text style={[styles.childModeTitle, { color: commonColors.white }]}>
                    {t('profile.childModeTitle')}
                  </Text>
                  <Text style={[styles.childModeDesc, { color: commonColors.white }]}>
                    {t('profile.childModeDesc')}
                  </Text>
                </View>
              </View>
              <ArrowRight size={responsive.moderateScaleForIcon(iconSizes.lg)} color={commonColors.white} />
            </TouchableOpacity>

            <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={styles.menuLeft}>
                    {(() => { const IconComp = profileIconMap[item.icon] || User; return <IconComp size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />; })()}
                    <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                      {t(item.titleKey)}
                    </Text>
                  </View>
                  <ChevronRight size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.surface }]}
              onPress={handleLogout}
            >
              <LogOut size={responsive.moderateScaleForIcon(iconSizes.lg)} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>
                {t('profile.logout')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <ErrorToast
        visible={profileError.visible}
        message={profileError.message}
        code={profileError.code}
        severity="error"
        duration={0}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  profileCard: {
    ...sharedStyles.rowBetween,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.medium,
  },
  avatar: {
    width: responsive.moderateScale(64),
    height: responsive.moderateScale(64),
    borderRadius: responsive.moderateScale(32),
    ...sharedStyles.columnCenter,
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  badge: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  childModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.medium,
  },
  childModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  childModeText: {
    marginLeft: spacing.md,
    flexShrink: 1,
    maxWidth: responsive.moderateScale(200),
  },
  childModeTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  childModeDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    marginTop: spacing.xs,
  },
  menuSection: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    borderRadius: borderRadius.xl,
    ...shadows.small,
  },
  menuItem: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuLeft: {
    ...sharedStyles.rowStart,
    gap: spacing.md,
  },
  menuText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
  },
  logoutButton: {
    ...sharedStyles.rowCenter,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    ...shadows.small,
  },
  logoutText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.medium,
  },

  skeletonContent: {
    flex: 1,
  },
  skeletonHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  skeletonTitle: {
    width: responsive.moderateScale(80),
    height: responsive.verticalScale(32),
    borderRadius: borderRadius.sm,
  },
  skeletonProfileCard: {
    ...sharedStyles.rowBetween,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  skeletonAvatar: {
    width: responsive.moderateScale(64),
    height: responsive.moderateScale(64),
    borderRadius: responsive.moderateScale(32),
    marginRight: spacing.md,
  },
  skeletonProfileInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonNickname: {
    width: responsive.moderateScale(100),
    height: responsive.verticalScale(20),
    borderRadius: responsive.moderateScale(10),
  },
  skeletonBadge: {
    width: responsive.moderateScale(70),
    height: responsive.verticalScale(14),
    borderRadius: responsive.moderateScale(7),
  },
  skeletonChildModeCard: {
    ...sharedStyles.rowBetween,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  skeletonChildModeContent: {
    ...sharedStyles.rowStart,
  },
  skeletonChildModeIcon: {
    width: responsive.moderateScale(32),
    height: responsive.moderateScale(32),
    borderRadius: responsive.moderateScale(16),
  },
  skeletonChildModeText: {
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  skeletonChildModeTitle: {
    width: responsive.moderateScale(100),
    height: responsive.verticalScale(16),
    borderRadius: responsive.moderateScale(8),
  },
  skeletonChildModeDesc: {
    width: responsive.moderateScale(140),
    height: responsive.verticalScale(12),
    borderRadius: responsive.moderateScale(6),
  },
  skeletonMenuSection: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  skeletonMenuItem: {
    ...sharedStyles.rowStart,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skeletonMenuIcon: {
    width: responsive.moderateScale(22),
    height: responsive.moderateScale(22),
    borderRadius: responsive.moderateScale(11),
  },
  skeletonMenuText: {
    width: responsive.moderateScale(80),
    height: responsive.verticalScale(16),
    borderRadius: responsive.moderateScale(8),
  },
  skeletonLogoutButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    height: responsive.verticalScale(52),
    borderRadius: borderRadius.xl,
  },
});
