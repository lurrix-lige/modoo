import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, responsive, iconSizes } from '../theme';
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

  const featuresArray: string[] = (typeof (plan.features as unknown) === 'string'
    ? (plan.features as unknown as string).split(' ').filter(Boolean)
    : plan.features) as string[];

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
          borderColor: isSelected ? colors.primary : (plan.recommended ? colors.primary : colors.border),
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
              {periodText || t(`membership.period.${plan.planKey.toLowerCase()}`, { defaultValue: '/月' })}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.features}>
        {featuresArray.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <CheckCircle
              size={responsive.moderateScale(iconSizes.sm)}
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
          <CheckCircle size={responsive.moderateScale(iconSizes.md)} color={commonColors.white} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
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
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    fontWeight: typography.fontWeight.semibold,
    color: commonColors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  pricePeriod: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginTop: responsive.verticalScale(2),
  },
  features: {
    gap: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: '50%',
    right: spacing.lg,
    width: responsive.moderateScale(24),
    height: responsive.moderateScale(24),
    borderRadius: responsive.moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: responsive.verticalScale(-12) }],
  },
});
