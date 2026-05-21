import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  ArrowLeft,
  Star,
  Headphones,
  BookOpen,
  MessageSquare,
  Check,
  CheckCircle,
} from 'lucide-react-native';
import { WechatIcon } from '../../../components/icons/WechatIcon';
import { AppleIcon } from '../../../components/icons/AppleIcon';

const membershipIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'arrow-back': ArrowLeft,
  star: Star,
  headset: Headphones,
  book: BookOpen,
  chatbubbles: MessageSquare,
  checkmark: Check,
  'checkmark-circle': CheckCircle,
};
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
import { Button, EmptyState, LoadingState } from '../../../components';
import { MembershipPlanCard } from '../../../components/MembershipPlanCard';
import { ParentStackParamList } from '../../../navigation/types';
import { useAppStore } from '../../../store';
import { apiService, MembershipPlan } from '../../../services';
import { useWechatPay, useApplePay } from '../../../hooks';
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
  {
    icon: 'headset',
    titleKey: 'membership.benefits.stories',
    descKey: 'membership.benefits.storiesDesc',
  },
  {
    icon: 'book',
    titleKey: 'membership.benefits.courses',
    descKey: 'membership.benefits.coursesDesc',
  },
  {
    icon: 'chatbubbles',
    titleKey: 'membership.benefits.expert',
    descKey: 'membership.benefits.expertDesc',
  },
  {
    icon: 'star',
    titleKey: 'membership.benefits.guardian',
    descKey: 'membership.benefits.guardianDesc',
  },
];

type PaymentMethod = 'wechat' | 'apple';

export default function MembershipScreen() {
  const navigation = useNavigation<MembershipNavigationProp>();
  const route = useRoute<MembershipRouteProp>();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAppStore();
  const {
    purchaseWithWechat,
    isLoading: isWechatLoading,
    error: wechatError,
    isWechatInstalled,
  } = useWechatPay();
  const {
    purchaseWithApple,
    isLoading: isAppleLoading,
    error: appleError,
    isApplePayAvailable,
  } = useApplePay();
  const [selectedPlan, setSelectedPlan] = useState<string>('quarterly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedPlanData = useMemo(
    () => plans.find((p) => p.id === selectedPlan),
    [plans, selectedPlan],
  );

  useEffect(() => {
    loadPlans();

    // 参考ServicesScreen 如果有 selectedPlanId则使用它
    if (route.params?.selectedPlanId) {
      setSelectedPlan(route.params.selectedPlanId);
    }
  }, [route.params?.selectedPlanId]);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const plans = await apiService.getMembershipPlans();
      setPlans(plans);
      // 默认选中板块用户已选择的，默认选中第一个
      if (plans.length > 0 && !plans.find((p) => p.id === selectedPlan)) {
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
      navigation.getParent()?.navigate('Auth', {
        fromScreen: 'Membership',
        selectedPlanId: selectedPlan,
      });
      return;
    }

    if (!selectedPlanData) {
      Alert.alert(t('common.error'), t('membership.planNotSelected'));
      return;
    }

    if (selectedPaymentMethod === 'wechat' && !isWechatInstalled) {
      Alert.alert(t('common.hint'), t('membership.wechatNotInstalled'));
      return;
    }

    if (selectedPaymentMethod === 'apple' && !isApplePayAvailable) {
      Alert.alert(t('common.hint'), t('membership.applePayNotAvailable'));
      return;
    }

    setIsProcessing(true);
    try {
      const purchaseFn =
        selectedPaymentMethod === 'wechat' ? purchaseWithWechat : purchaseWithApple;
      const result = await purchaseFn(selectedPlan, selectedPlanData.nameKey);

      if (result.success) {
        const { setPaidStatus } = useAppStore.getState();
        setPaidStatus(true);
        Alert.alert(t('membership.openSuccess'), t('membership.openSuccessDesc'));
        navigation.goBack();
      } else {
        logger.warn(`${selectedPaymentMethod} pay failed`, {
          error: result.error,
          errorCode: result.errorCode,
        });
        if (result.errorCode === 'USER_CANCEL') {
          return;
        }
        Alert.alert(t('membership.openFailed'), result.error || t('membership.payFailedDesc'));
      }
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
          <ArrowLeft
            size={responsive.moderateScaleForIcon(iconSizes.lg)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('membership.openMembership')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
            <Star
              size={responsive.moderateScaleForIcon(iconSizes.xxxl)}
              color={commonColors.white}
            />
            <Text style={[styles.heroTitle, { color: commonColors.white }]}>
              {t('membership.heroTitle')}
            </Text>
            <Text style={[styles.heroDesc, { color: commonColors.white }]}>
              {t('membership.heroDesc')}
            </Text>
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('membership.membershipBenefits')}
          </Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={[styles.benefitCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.primary + '20' }]}>
                  {(() => {
                    const IconComp = membershipIconMap[benefit.icon] || Star;
                    return (
                      <IconComp
                        size={responsive.moderateScaleForIcon(iconSizes.lg)}
                        color={colors.primary}
                      />
                    );
                  })()}
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('membership.selectPlan')}
          </Text>
          {isLoading ? (
            <LoadingState text={t('common.loading')} />
          ) : plans.length === 0 ? (
            <EmptyState title={t('common.noData')} description={t('membership.noPlansAvailable')} />
          ) : (
            plans.map((plan) => (
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
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t('membership.agreement.terms')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
            {t('membership.agreement.and')}
          </Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t('membership.agreement.privacy')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.paymentSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('membership.selectPayment')}
          </Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                {
                  backgroundColor:
                    selectedPaymentMethod === 'wechat' ? colors.primary + '10' : colors.surface,
                },
                {
                  borderColor: selectedPaymentMethod === 'wechat' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => isWechatInstalled && setSelectedPaymentMethod('wechat')}
              disabled={!isWechatInstalled}
            >
              <WechatIcon
                size={24}
                color={selectedPaymentMethod === 'wechat' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  {
                    color: selectedPaymentMethod === 'wechat' ? colors.primary : colors.textPrimary,
                  },
                ]}
              >
                {t('membership.wechatPay')}
              </Text>
              {selectedPaymentMethod === 'wechat' && (
                <CheckCircle size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  {
                    backgroundColor:
                      selectedPaymentMethod === 'apple' ? colors.primary + '10' : colors.surface,
                  },
                  {
                    borderColor: selectedPaymentMethod === 'apple' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => isApplePayAvailable && setSelectedPaymentMethod('apple')}
                disabled={!isApplePayAvailable}
              >
                <AppleIcon
                  size={24}
                  color={selectedPaymentMethod === 'apple' ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    {
                      color:
                        selectedPaymentMethod === 'apple' ? colors.primary : colors.textPrimary,
                    },
                  ]}
                >
                  {t('membership.applePay')}
                </Text>
                {selectedPaymentMethod === 'apple' && (
                  <CheckCircle size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {!isLoading && plans.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
              {t('membership.payableAmount')}
            </Text>
            <View style={styles.footerPrice}>
              <Text style={[styles.footerValue, { color: colors.textPrimary }]}>
                {formatCurrency(
                  selectedPlanData?.currentPrice || selectedPlanData?.price || 0,
                  'CNY',
                  i18n.language,
                )}
              </Text>
            </View>
          </View>
          <Button
            title={t('membership.subscribeNow')}
            onPress={handleSubscribe}
            loading={isProcessing}
            disabled={!selectedPlanData}
            style={styles.subscribeButton}
          />
        </View>
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  agreementSection: {
    ...sharedStyles.rowCenter,
    flexWrap: 'wrap',
    gap: responsive.moderateScale(4),
    paddingBottom: responsive.verticalScale(120),
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  agreementText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  backButton: {
    padding: spacing.sm,
    width: responsive.moderateScale(40),
  },
  benefitCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '48%',
    ...sharedStyles.columnCenter,
    ...shadows.small,
  },
  benefitDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    textAlign: 'center',
  },
  benefitIcon: {
    borderRadius: responsive.moderateScale(24),
    height: responsive.moderateScale(48),
    width: responsive.moderateScale(48),
    ...sharedStyles.columnCenter,
    marginBottom: spacing.sm,
  },
  benefitTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  benefitsSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  container: {
    flex: 1,
  },
  featureItem: {
    ...sharedStyles.rowStart,
    gap: spacing.sm,
  },
  featureText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  footer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    ...sharedStyles.rowBetween,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...shadows.large,
  },
  footerInfo: {
    flexDirection: 'column',
  },
  footerLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  footerPrice: {
    alignItems: 'baseline',
    flexDirection: 'row',
  },
  footerSymbol: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  footerValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  header: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...sharedStyles.columnCenter,
    ...shadows.medium,
  },
  heroDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginTop: spacing.sm,
  },
  heroSection: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  heroTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  linkText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    textDecorationLine: 'underline',
  },
  paymentOption: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    flexDirection: 'row',
    padding: spacing.lg,
    ...shadows.small,
  },
  paymentOptionText: {
    flex: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.md,
  },
  paymentOptions: {
    gap: spacing.md,
  },
  paymentSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  placeholder: {
    width: responsive.moderateScale(40),
  },
  planCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    position: 'relative',
    ...shadows.small,
  },
  planFeatures: {
    gap: spacing.sm,
  },
  planHeader: {
    alignItems: 'flex-start',
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
  plansSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  popularBadge: {
    borderRadius: responsive.moderateScale(12),
    paddingHorizontal: responsive.moderateScale(12),
    paddingVertical: responsive.verticalScale(2),
    position: 'absolute',
    right: spacing.md,
    top: responsive.verticalScale(-10),
  },
  popularText: {
    fontSize: responsive.scaledFontSize(10),
    fontWeight: typography.fontWeight.semibold,
  },
  pricePeriod: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginLeft: responsive.moderateScale(2),
  },
  priceSymbol: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
  priceValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  selectedIndicator: {
    borderRadius: responsive.moderateScale(12),
    height: responsive.moderateScale(24),
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    width: responsive.moderateScale(24),
    ...sharedStyles.columnCenter,
    transform: [{ translateY: responsive.verticalScale(-12) }],
  },
  subscribeButton: {
    width: responsive.moderateScale(160),
  },
  title: {
    flex: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginHorizontal: spacing.sm,
    textAlign: 'center',
  },
});
