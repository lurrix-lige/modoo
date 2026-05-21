/**
 * 服务页面组件
 *
 * 数据来源说明�? * - 使用 apiService.getServices() 获取服务列表
 * - 使用 apiService.getMembershipPlans() 获取会员套餐
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  ShieldCheck,
  Star,
  Zap,
  Headphones,
  BookOpen,
  Leaf,
  User,
  Calendar,
} from 'lucide-react-native';
import { MembershipPlanCard } from '../../../components/MembershipPlanCard';

const servicesIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'shield-checkmark': ShieldCheck,
  star: Star,
  flash: Zap,
  headset: Headphones,
  book: BookOpen,
  leaf: Leaf,
  person: User,
  calendar: Calendar,
};
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
  responsive,
  iconSizes,
} from '../../../theme';
import { apiService, Service, MembershipPlan } from '../../../services';
import { ErrorToast } from '../../../components';
import { logger } from '../../../utils/logger';

export default function ServicesScreen() {
  const navigation = useNavigation<any>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [error, setError] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

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
    } catch (err) {
      logger.error('Failed to load services data', { error: err });
      setError({ visible: true, message: t('common.loadFailed') });
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
        {[1, 2, 3].map((i) => (
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

      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.skeletonPlanCard, { backgroundColor: colors.surface }]}>
          <View style={styles.skeletonPlanHeader}>
            <View style={[styles.skeletonPlanName, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonPlanPrice, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.skeletonPlanFeatures}>
            {[1, 2, 3, 4].map((j) => (
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
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
              {services.map((service) => (
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
                    {(() => {
                      const IconComp = servicesIconMap[service.icon] || Star;
                      return (
                        <IconComp
                          size={responsive.moderateScaleForIcon(iconSizes.xl)}
                          color={colors.textPrimary}
                        />
                      );
                    })()}
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
                  <Calendar
                    size={responsive.moderateScaleForIcon(iconSizes.xl)}
                    color={colors.primary}
                  />
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

              {plans.map((plan) => (
                <MembershipPlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={false}
                  onPress={() =>
                    navigation.getParent()?.navigate('Membership', { selectedPlanId: plan.id })
                  }
                />
              ))}

              <View style={[styles.trustBadge, { backgroundColor: colors.surface }]}>
                <ShieldCheck
                  size={responsive.moderateScaleForIcon(iconSizes.md)}
                  color={colors.success}
                />
                <Text style={[styles.trustText, { color: colors.textSecondary }]}>
                  {t('services.trustBadge')}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <ErrorToast
        visible={error.visible}
        message={error.message}
        severity="error"
        duration={5000}
        onDismiss={() => setError({ visible: false, message: '' })}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
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
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  serviceCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '47%',
    ...shadows.small,
  },
  serviceIcon: {
    alignItems: 'center',
    borderRadius: responsive.moderateScale(28),
    height: responsive.moderateScale(56),
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: responsive.moderateScale(56),
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
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
    position: 'relative',
    ...shadows.small,
  },
  planHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
  },
  planPrice: {
    alignItems: 'baseline',
    flexDirection: 'row',
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  trustBadge: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  trustText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },

  // Skeleton styles
  skeletonContent: {
    flex: 1,
  },
  skeletonHeader: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  skeletonTitle: {
    borderRadius: borderRadius.sm,
    height: responsive.verticalScale(32),
    width: responsive.moderateScale(80),
  },
  skeletonSubtitle: {
    borderRadius: responsive.moderateScale(8),
    height: responsive.verticalScale(16),
    marginTop: spacing.sm,
    width: responsive.moderateScale(160),
  },
  skeletonServicesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  skeletonServiceCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flex: 1,
    padding: spacing.lg,
  },
  skeletonServiceIcon: {
    borderRadius: responsive.moderateScale(28),
    height: responsive.moderateScale(56),
    marginBottom: spacing.md,
    width: responsive.moderateScale(56),
  },
  skeletonServiceTitle: {
    borderRadius: responsive.moderateScale(8),
    height: responsive.verticalScale(16),
    marginBottom: spacing.xs,
    width: responsive.moderateScale(60),
  },
  skeletonServiceDesc: {
    borderRadius: responsive.moderateScale(6),
    height: responsive.verticalScale(12),
    width: responsive.moderateScale(50),
  },
  skeletonSection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  skeletonSectionTitle: {
    borderRadius: responsive.moderateScale(10),
    height: responsive.verticalScale(20),
    marginBottom: spacing.xs,
    width: responsive.moderateScale(100),
  },
  skeletonSectionDesc: {
    borderRadius: responsive.moderateScale(7),
    height: responsive.verticalScale(14),
    width: responsive.moderateScale(180),
  },
  skeletonPlanCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
  },
  skeletonPlanHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  skeletonPlanName: {
    borderRadius: responsive.moderateScale(10),
    height: responsive.verticalScale(20),
    width: responsive.moderateScale(80),
  },
  skeletonPlanPrice: {
    borderRadius: responsive.moderateScale(12),
    height: responsive.verticalScale(24),
    width: responsive.moderateScale(60),
  },
  skeletonPlanFeatures: {
    gap: spacing.xs,
  },
  skeletonFeature: {
    borderRadius: responsive.moderateScale(7),
    height: responsive.verticalScale(14),
    width: '70%',
  },
  skeletonTrustBadge: {
    borderRadius: borderRadius.md,
    height: responsive.verticalScale(48),
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
});
