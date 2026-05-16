/**
 * 服务页面组件
 *
 * 数据来源说明�? * - 使用 apiService.getServices() 获取服务列表
 * - 使用 apiService.getMembershipPlans() 获取会员套餐
 */

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
import { ShieldCheck, Star, Zap, Headphones, BookOpen, Leaf, User, Calendar } from 'lucide-react-native';
import { MembershipPlanCard } from '../../../components/MembershipPlanCard';

const servicesIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'shield-checkmark': ShieldCheck,
  'star': Star,
  'flash': Zap,
  'headset': Headphones,
  'book': BookOpen,
  'leaf': Leaf,
  'person': User,
  'calendar': Calendar,
};
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles, responsive, iconSizes } from '../../../theme';
import { apiService, Service, MembershipPlan } from '../../../services';
import { logger } from '../../../utils/logger';

export default function ServicesScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [servicesData, plansData] = await Promise.all([
        apiService.getServices(),
        apiService.getMembershipPlans(),
      ]);
      setServices(servicesData);
      setPlans(plansData);
    } catch (error) {
      logger.error('Failed to load services data', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonSubtitle, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.skeletonServicesGrid}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.skeletonServiceCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.skeletonServiceIcon, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonServiceTitle, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonServiceDesc, { backgroundColor: colors.border }]} />
          </View>
        ))}
      </View>

      <View style={styles.skeletonSection}>
        <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonSectionDesc, { backgroundColor: colors.border }]} />
      </View>

      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.skeletonPlanCard, { backgroundColor: colors.surface }]}>
          <View style={styles.skeletonPlanHeader}>
            <View style={[styles.skeletonPlanName, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonPlanPrice, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.skeletonPlanFeatures}>
            {[1, 2, 3, 4].map(j => (
              <View key={j} style={[styles.skeletonFeature, { backgroundColor: colors.border }]} />
            ))}
          </View>
        </View>
      ))}

      <View style={[styles.skeletonTrustBadge, { backgroundColor: colors.surface }]} />
    </View>
  );

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('services.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('services.subtitle')}
          </Text>
        </View>

        {isLoading ? (
          renderLoadingSkeleton()
        ) : (
          <>
            <View style={styles.servicesGrid}>
              {services.map(service => (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceCard, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    if (service.id === 'expert') {
                      navigation.getParent()?.navigate('ExpertConsult');
                    } else if (service.id === 'course') {
                      Alert.alert(t('services.course'), t('services.comingSoon'));
                    } else if (service.id === 'report') {
                      Alert.alert(t('services.report'), t('services.comingSoon'));
                    }
                  }}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: colors[service.colorKey] }]}>
                    {(() => { const IconComp = servicesIconMap[service.icon] || Star; return <IconComp size={responsive.moderateScaleForIcon(iconSizes.xl)} color={colors.textPrimary} />; })()}
                  </View>
                  <Text style={[styles.serviceTitle, { color: colors.textPrimary }]}>
                    {t(service.titleKey)}
                  </Text>
                  <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>
                    {t(service.descKey)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.serviceCard, { backgroundColor: colors.surface }]}
                onPress={() => navigation.getParent()?.navigate('ExpertBookings')}
              >
                <View style={[styles.serviceIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Calendar size={responsive.moderateScaleForIcon(iconSizes.xl)} color={colors.primary} />
                </View>
                <Text style={[styles.serviceTitle, { color: colors.textPrimary }]}>
                  {t('services.manageBookings')}
                </Text>
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>
                  {t('services.manageBookingsDesc')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('services.membershipTitle')}
              </Text>
              <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                {t('services.membershipSubtitle')}
              </Text>

              {plans.map(plan => (
                <MembershipPlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={false}
                  onPress={() => navigation.getParent()?.navigate('Membership', { selectedPlanId: plan.id })}
                />
              ))}

              <View style={[styles.trustBadge, { backgroundColor: colors.surface }]}>
                <ShieldCheck size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.success} />
                <Text style={[styles.trustText, { color: colors.textSecondary }]}>
                  {t('services.trustBadge')}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
  subtitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginTop: spacing.xs,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  serviceCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.small,
  },
  serviceIcon: {
    width: responsive.moderateScale(56),
    height: responsive.moderateScale(56),
    borderRadius: responsive.moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  serviceTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  serviceDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginBottom: spacing.lg,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    position: 'relative',
    ...shadows.small,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  pricePeriod: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginLeft: spacing.xs,
  },
  planFeatures: {
    gap: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  trustText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },

  // Skeleton styles
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
  skeletonSubtitle: {
    width: responsive.moderateScale(160),
    height: responsive.verticalScale(16),
    borderRadius: responsive.moderateScale(8),
    marginTop: spacing.sm,
  },
  skeletonServicesGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  skeletonServiceCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  skeletonServiceIcon: {
    width: responsive.moderateScale(56),
    height: responsive.moderateScale(56),
    borderRadius: responsive.moderateScale(28),
    marginBottom: spacing.md,
  },
  skeletonServiceTitle: {
    width: responsive.moderateScale(60),
    height: responsive.verticalScale(16),
    borderRadius: responsive.moderateScale(8),
    marginBottom: spacing.xs,
  },
  skeletonServiceDesc: {
    width: responsive.moderateScale(50),
    height: responsive.verticalScale(12),
    borderRadius: responsive.moderateScale(6),
  },
  skeletonSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  skeletonSectionTitle: {
    width: responsive.moderateScale(100),
    height: responsive.verticalScale(20),
    borderRadius: responsive.moderateScale(10),
    marginBottom: spacing.xs,
  },
  skeletonSectionDesc: {
    width: responsive.moderateScale(180),
    height: responsive.verticalScale(14),
    borderRadius: responsive.moderateScale(7),
  },
  skeletonPlanCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  skeletonPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  skeletonPlanName: {
    width: responsive.moderateScale(80),
    height: responsive.verticalScale(20),
    borderRadius: responsive.moderateScale(10),
  },
  skeletonPlanPrice: {
    width: responsive.moderateScale(60),
    height: responsive.verticalScale(24),
    borderRadius: responsive.moderateScale(12),
  },
  skeletonPlanFeatures: {
    gap: spacing.xs,
  },
  skeletonFeature: {
    width: '70%',
    height: responsive.verticalScale(14),
    borderRadius: responsive.moderateScale(7),
  },
  skeletonTrustBadge: {
    marginHorizontal: spacing.xl,
    height: responsive.verticalScale(48),
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
});
