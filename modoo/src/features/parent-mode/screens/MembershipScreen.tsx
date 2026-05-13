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
import { ArrowLeft, Star, Headphones, BookOpen, MessageSquare, Check, CheckCircle } from 'lucide-react-native';

const membershipIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'arrow-back': ArrowLeft,
  'star': Star,
  'headset': Headphones,
  'book': BookOpen,
  'chatbubbles': MessageSquare,
  'checkmark': Check,
  'checkmark-circle': CheckCircle,
};
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles, responsive, iconSizes } from '../../../theme';
import { Button, EmptyState, LoadingState } from '../../../components';
import { MembershipPlanCard } from '../../../components/MembershipPlanCard';
import { ParentStackParamList } from '../../../navigation/types';
import { useAppStore } from '../../../store';
import { apiService, MembershipPlan } from '../../../services';
import { formatCurrency } from '../../../utils/currency';
import { logger } from '../../../utils/logger';

type MembershipNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'Membership'>;
type MembershipRouteProp = RouteProp<ParentStackParamList, 'Membership'>;

interface Benefit {
  icon: string;
  titleKey: string;
  descKey: string;
}

const BENEFITS: Benefit[] = [
  { icon: 'headset', titleKey: 'membership.benefits.stories', descKey: 'membership.benefits.storiesDesc' },
  { icon: 'book', titleKey: 'membership.benefits.courses', descKey: 'membership.benefits.coursesDesc' },
  { icon: 'chatbubbles', titleKey: 'membership.benefits.expert', descKey: 'membership.benefits.expertDesc' },
  { icon: 'star', titleKey: 'membership.benefits.guardian', descKey: 'membership.benefits.guardianDesc' },
];

export default function MembershipScreen() {
  const navigation = useNavigation<MembershipNavigationProp>();
  const route = useRoute<MembershipRouteProp>();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('quarterly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlans();

    // 如果从ServicesScreen 传递了 selectedPlanId，则使用它
    if (route.params?.selectedPlanId) {
      setSelectedPlan(route.params.selectedPlanId);
    }
  }, [route.params?.selectedPlanId]);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const plans = await apiService.getMembershipPlans();
      setPlans(plans);
      // 如果有套餐且没有已选择的，默认选择第一个
      if (plans.length > 0 && !plans.find(p => p.id === selectedPlan)) {
        setSelectedPlan(plans[0].id);
      }
    } catch (error) {
      logger.error('Failed to load membership plans', { error });
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      // 未登录时直接跳转到登录页面，保存用户选择的套餐
      navigation.getParent()?.navigate('Auth', { 
        fromScreen: 'Membership', 
        selectedPlanId: selectedPlan 
      });
      return;
    }

    setIsProcessing(true);
    try {
      await apiService.subscribe(selectedPlan, true); // 传入 suppressError，避免重复提示
      const { setPaidStatus } = useAppStore.getState();
      setPaidStatus(true);
      Alert.alert(t('membership.openSuccess'), t('membership.openSuccessDesc'));
      navigation.goBack();
    } catch (error) {
      logger.error('Failed to subscribe', { error });
      Alert.alert(t('membership.openFailed'), t('membership.openFailedDesc'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={responsive.moderateScale(iconSizes.lg)} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('membership.openMembership')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <Star size={responsive.moderateScale(iconSizes.xxxl)} color={commonColors.white} />
            <Text style={[styles.heroTitle, { color: commonColors.white }]}>{t('membership.heroTitle')}</Text>
            <Text style={[styles.heroDesc, { color: commonColors.white }]}>{t('membership.heroDesc')}</Text>
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('membership.membershipBenefits')}</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit, index) => (
            <View key={index} style={[styles.benefitCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '20' }]}>
                {(() => { const IconComp = membershipIconMap[benefit.icon] || Star; return <IconComp size={responsive.moderateScale(iconSizes.lg)} color={colors.primary} />; })()}
              </View>
              <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
                {t(benefit.titleKey)}
              </Text>
              <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                {t(benefit.descKey)}
              </Text>
            </View>
          ))}
          </View>
        </View>

        <View style={styles.plansSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('membership.selectPlan')}</Text>
          {isLoading ? (
            <LoadingState text={t('common.loading')} />
          ) : plans.length === 0 ? (
            <EmptyState 
              title={t('common.noData')} 
              description={t('membership.noPlansAvailable')}
            />
          ) : (
            plans.map(plan => (
              <MembershipPlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                showPeriod={false}
                periodText={`/${t('membership.perMonth')}`}
              />
            ))
          )}
        </View>

        <View style={styles.agreementSection}>
          <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
            {t('membership.agreement.prefix')}
          </Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('membership.agreement.terms')}</Text>
          </TouchableOpacity>
          <Text style={[styles.agreementText, { color: colors.textSecondary }]}>{t('membership.agreement.and')}</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('membership.agreement.privacy')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {!isLoading && plans.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>{t('membership.payableAmount')}</Text>
            <View style={styles.footerPrice}>
              <Text style={[styles.footerValue, { color: colors.textPrimary }]}>
                {formatCurrency(plans.find(p => p.id === selectedPlan)?.currentPrice || plans.find(p => p.id === selectedPlan)?.price || 0, 'CNY', i18n.language)}
              </Text>
            </View>
          </View>
          <Button
            title={t('membership.subscribeNow')}
            onPress={handleSubscribe}
            loading={isProcessing}
            disabled={!plans.find(p => p.id === selectedPlan)}
            style={styles.subscribeButton}
          />
        </View>
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    width: responsive.moderateScale(40),
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  placeholder: {
    width: responsive.moderateScale(40),
  },
  heroSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...sharedStyles.columnCenter,
    ...shadows.medium,
  },
  heroTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  heroDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginTop: spacing.sm,
  },
  benefitsSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  benefitCard: {
    width: '48%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...sharedStyles.columnCenter,
    ...shadows.small,
  },
  benefitIcon: {
    width: responsive.moderateScale(48),
    height: responsive.moderateScale(48),
    borderRadius: responsive.moderateScale(24),
    ...sharedStyles.columnCenter,
    marginBottom: spacing.sm,
  },
  benefitTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  benefitDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    textAlign: 'center',
  },
  plansSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  planCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
    ...shadows.small,
  },
  popularBadge: {
    position: 'absolute',
    top: responsive.verticalScale(-10),
    right: spacing.md,
    paddingHorizontal: responsive.moderateScale(12),
    paddingVertical: responsive.verticalScale(2),
    borderRadius: responsive.moderateScale(12),
  },
  popularText: {
    fontSize: responsive.scaledFontSize(10),
    fontWeight: typography.fontWeight.semibold,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  priceSymbol: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  priceValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  pricePeriod: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginLeft: responsive.moderateScale(2),
  },
  planFeatures: {
    gap: spacing.sm,
  },
  featureItem: {
    ...sharedStyles.rowStart,
    gap: spacing.sm,
  },
  featureText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  selectedIndicator: {
    position: 'absolute',
    top: '50%',
    right: spacing.lg,
    width: responsive.moderateScale(24),
    height: responsive.moderateScale(24),
    borderRadius: responsive.moderateScale(12),
    ...sharedStyles.columnCenter,
    transform: [{ translateY: responsive.verticalScale(-12) }],
  },
  agreementSection: {
    ...sharedStyles.rowCenter,
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: responsive.verticalScale(120),
    gap: responsive.moderateScale(4),
  },
  agreementText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  linkText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    ...shadows.large,
  },
  footerInfo: {
    flexDirection: 'column',
  },
  footerLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  footerPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  footerSymbol: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  footerValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  subscribeButton: {
    width: responsive.moderateScale(160),
  },
});
