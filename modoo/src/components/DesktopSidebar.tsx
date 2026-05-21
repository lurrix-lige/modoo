import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Home,
  BookOpen,
  Headphones,
  User,
  Settings,
  Heart,
  MessageSquare,
  BarChart3,
  Moon,
  Star,
  FileText,
  Shield,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  commonColors,
  iconSizes,
  responsive,
} from '../theme';
import { useAppStore } from '../store';

const navItems = [
  { id: 'home', icon: Home, labelKey: 'parentHome.home' },
  { id: 'knowledge', icon: BookOpen, labelKey: 'parentHome.knowledge' },
  { id: 'services', icon: Headphones, labelKey: 'parentHome.services' },
  { id: 'profile', icon: User, labelKey: 'parentHome.profile' },
];

const secondaryItems = [
  { id: 'favorites', icon: Heart, labelKey: 'parentHome.favorites' },
  { id: 'dialogue', icon: MessageSquare, labelKey: 'parentHome.dialogues' },
  { id: 'growth', icon: BarChart3, labelKey: 'parentHome.growthFile' },
  { id: 'relax', icon: Moon, labelKey: 'parentHome.relaxSpace' },
];

interface DesktopSidebarProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, onTabPress }) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { child, isAuthenticated, switchToChildMode } = useAppStore();

  return (
    <View
      style={[styles.sidebar, { backgroundColor: isDark ? colors.surface : commonColors.white }]}
    >
      <View style={styles.logoSection}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Star size={responsive.moderateScaleForIcon(iconSizes.xl)} color={commonColors.white} />
        </View>
        <Text style={[styles.logoText, { color: colors.textPrimary }]}>Dozoo</Text>
      </View>

      <View style={styles.navSection}>
        {navItems.map((item) => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                { backgroundColor: isActive ? colors.primary + '10' : 'transparent' },
              ]}
              onPress={() => onTabPress(item.id)}
            >
              <IconComp
                size={responsive.moderateScaleForIcon(iconSizes.lg)}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[styles.navLabel, { color: isActive ? colors.primary : colors.textPrimary }]}
              >
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      <View style={styles.secondarySection}>
        {secondaryItems.map((item) => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => onTabPress(item.id)}
            >
              <IconComp
                size={responsive.moderateScaleForIcon(iconSizes.md)}
                color={colors.textSecondary}
              />
              <Text style={[styles.navLabel, { color: colors.textSecondary }]}>
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      {child && (
        <TouchableOpacity
          style={[styles.childModeButton, { backgroundColor: colors.secondary + '20' }]}
          onPress={switchToChildMode}
        >
          <View style={[styles.childIcon, { backgroundColor: colors.secondary }]}>
            <Shield
              size={responsive.moderateScaleForIcon(iconSizes.sm)}
              color={commonColors.white}
            />
          </View>
          <View style={styles.childInfo}>
            <Text style={[styles.childName, { color: colors.textPrimary }]}>{child.nickname}</Text>
            <Text style={[styles.childModeLabel, { color: colors.textSecondary }]}>
              {t('parentHome.childMode')}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => onTabPress('settings')}>
          <Settings
            size={responsive.moderateScaleForIcon(iconSizes.md)}
            color={colors.textSecondary}
          />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>
            {t('common.settings')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSection: {
    gap: spacing.xs,
    marginTop: 'auto',
  },
  childIcon: {
    alignItems: 'center',
    borderRadius: responsive.moderateScale(18),
    height: responsive.moderateScale(36),
    justifyContent: 'center',
    width: responsive.moderateScale(36),
  },
  childInfo: {
    flex: 1,
  },
  childModeButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.md,
  },
  childModeLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  childName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    backgroundColor: '#e5e7eb',
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  logo: {
    alignItems: 'center',
    borderRadius: responsive.moderateScale(12),
    height: responsive.moderateScale(40),
    justifyContent: 'center',
    width: responsive.moderateScale(40),
  },
  logoSection: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    left: spacing.md,
    right: spacing.md,
    top: spacing.xl,
  },
  logoText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
  },
  navLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
  },
  navSection: {
    gap: spacing.xs,
    marginTop: spacing.xxl + spacing.md,
  },
  secondarySection: {
    gap: spacing.xs,
  },
  settingsButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
  },
  sidebar: {
    borderRightColor: '#e5e7eb',
    borderRightWidth: StyleSheet.hairlineWidth,
    flexDirection: 'column',
    height: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    width: responsive.moderateScale(240),
  },
});

export default DesktopSidebar;
