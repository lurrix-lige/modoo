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
  Shield
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, commonColors, iconSizes, responsive } from '../theme';
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
    <View style={[styles.sidebar, { backgroundColor: isDark ? colors.surface : commonColors.white }]}>
      <View style={styles.logoSection}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Star size={responsive.moderateScale(iconSizes.xl)} color={commonColors.white} />
        </View>
        <Text style={[styles.logoText, { color: colors.textPrimary }]}>Dozoo</Text>
      </View>

      <View style={styles.navSection}>
        {navItems.map(item => {
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
                size={responsive.moderateScale(iconSizes.lg)} 
                color={isActive ? colors.primary : colors.textSecondary} 
              />
              <Text style={[
                styles.navLabel,
                { color: isActive ? colors.primary : colors.textPrimary },
              ]}>
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      <View style={styles.secondarySection}>
        {secondaryItems.map(item => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => onTabPress(item.id)}
            >
              <IconComp 
                size={responsive.moderateScale(iconSizes.md)} 
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
            <Shield size={responsive.moderateScale(iconSizes.sm)} color={commonColors.white} />
          </View>
          <View style={styles.childInfo}>
            <Text style={[styles.childName, { color: colors.textPrimary }]}>
              {child.nickname}
            </Text>
            <Text style={[styles.childModeLabel, { color: colors.textSecondary }]}>
              {t('parentHome.childMode')}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => onTabPress('settings')}>
          <Settings size={responsive.moderateScale(iconSizes.md)} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>
            {t('common.settings')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: responsive.moderateScale(240),
    height: '100%',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e5e7eb',
    flexDirection: 'column',
  },
  logoSection: {
    ...StyleSheet.absoluteFillObject,
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: responsive.moderateScale(40),
    height: responsive.moderateScale(40),
    borderRadius: responsive.moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
  },
  navSection: {
    marginTop: spacing.xxl + spacing.md,
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  navLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginVertical: spacing.md,
  },
  secondarySection: {
    gap: spacing.xs,
  },
  childModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  },
  childIcon: {
    width: responsive.moderateScale(36),
    height: responsive.moderateScale(36),
    borderRadius: responsive.moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    fontWeight: typography.fontWeight.medium,
  },
  childModeLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  bottomSection: {
    marginTop: 'auto',
    gap: spacing.xs,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
});

export default DesktopSidebar;
