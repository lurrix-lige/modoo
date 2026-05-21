import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  shadows,
  commonColors,
  responsive,
  iconSizes,
} from '../theme';
import { MembershipPlan } from '../services';
import { formatCurrency } from '../utils/currency';

interface MembershipPlanCardProps {
  plan: MembershipPlan;
  isSelected?: boolean;
  onPress?: () => void;
  showPeriod?: boolean;
  periodText?: string;
}

export function MembershipPlanCard({
  plan,
  isSelected = false,
  onPress,
  showPeriod = true,
  periodText,
}: MembershipPlanCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const featuresArray: string[] = (
    typeof (plan.features as unknown) === 'string'
      ? (plan.features as unknown as string).split(' ').filter(Boolean)
      : plan.features
  ) as string[];

  const price = plan.currentPrice ?? plan.price ?? 0;
  const planName = plan.nameKey
    ? t(plan.nameKey)
    : t(`membership.plan.${plan.planKey.toLowerCase()}`, { defaultValue: plan.name || plan.id });

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: plan.recommended ? colors.primary : colors.surface,
          borderColor: isSelected
            ? colors.primary
            : plan.recommended
              ? colors.primary
              : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {plan.recommended && (
        <View style={[styles.popularBadge, { backgroundColor: colors.warning }]}>
          <Text style={styles.popularText}>{t('membership.recommended')}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text
          style={[
            styles.planName,
            { color: plan.recommended ? commonColors.white : colors.textPrimary },
          ]}
        >
          {planName}
        </Text>
        <View style={styles.priceContainer}>
          <Text
            style={[
              styles.priceValue,
              { color: plan.recommended ? commonColors.white : colors.textPrimary },
            ]}
          >
            {formatCurrency(price, 'CNY', i18n.language)}
          </Text>
          {showPeriod && (
            <Text
              style={[
                styles.pricePeriod,
                { color: plan.recommended ? commonColors.white : colors.textSecondary },
              ]}
            >
              {periodText ||
                t(`membership.period.${plan.planKey.toLowerCase()}`, { defaultValue: '/月' })}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.features}>
        {featuresArray.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <CheckCircle
              size={responsive.moderateScaleForIcon(iconSizes.sm)}
              color={plan.recommended ? commonColors.white : colors.success}
            />
            <Text
              style={[
                styles.featureText,
                { color: plan.recommended ? commonColors.white : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {t(feature)}
            </Text>
          </View>
        ))}
      </View>

      {isSelected && (
        <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
          <CheckCircle
            size={responsive.moderateScaleForIcon(iconSizes.md)}
            color={commonColors.white}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    position: 'relative',
    ...shadows.small,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  features: {
    gap: spacing.xs,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  planName: {
    flex: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
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
    color: commonColors.white,
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    fontWeight: typography.fontWeight.semibold,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  pricePeriod: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginTop: responsive.verticalScale(2),
  },
  priceValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  selectedIndicator: {
    alignItems: 'center',
    borderRadius: responsive.moderateScale(12),
    height: responsive.moderateScale(24),
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    transform: [{ translateY: responsive.verticalScale(-12) }],
    width: responsive.moderateScale(24),
  },
});
