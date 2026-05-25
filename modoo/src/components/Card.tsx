import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Image } from 'react-native';
import { BookOpen, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

const cardIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  book: BookOpen,
  'time-outline': Clock,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  remove: Minus,
};
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  shadows,
  typography,
  commonColors,
  glassEffect,
  responsive,
  iconSizes,
} from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  variant?: 'solid' | 'glass';
  elevated?: boolean;
  animated?: boolean;
  disableTouchFeedback?: boolean;
}

export function Card({
  children,
  style,
  onPress,
  variant = 'solid',
  elevated = false,
  animated = true,
  disableTouchFeedback = false,
}: CardProps) {
  const { colors, isDark } = useTheme();

  const cardStyle = useMemo(() => {
    const glass = isDark ? glassEffect.dark : glassEffect.light;
    const shadowStyle = elevated ? shadows.large : shadows.medium;

    if (variant === 'glass') {
      return [
        styles.card,
        {
          backgroundColor: glass.backgroundColor,
          borderColor: glass.borderColor,
          borderWidth: glass.borderWidth,
          borderRadius: borderRadius.xl,
          ...shadowStyle,
        },
        style,
      ];
    }
    return [
      styles.card,
      {
        backgroundColor: colors.surface,
        ...shadows.medium,
      },
      style,
    ];
  }, [variant, elevated, style, colors.surface, isDark]);

  if (onPress && variant === 'glass' && animated) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, cardStyle, pressed && styles.pressed]}
      >
        {variant === 'glass' && (
          <View
            style={[
              styles.highlight,
              { backgroundColor: (isDark ? glassEffect.dark : glassEffect.light).highlightColor },
            ]}
          />
        )}
        {children}
      </Pressable>
    );
  }

  if (onPress) {
    const Wrapper = variant === 'glass' ? Pressable : TouchableOpacity;
    return (
      <Wrapper style={cardStyle} onPress={onPress} activeOpacity={0.9}>
        {variant === 'glass' && (
          <View
            style={[
              styles.highlight,
              { backgroundColor: (isDark ? glassEffect.dark : glassEffect.light).highlightColor },
            ]}
          />
        )}
        {children}
      </Wrapper>
    );
  }

  return (
    <View style={cardStyle}>
      {variant === 'glass' && (
        <View
          style={[
            styles.highlight,
            { backgroundColor: (isDark ? glassEffect.dark : glassEffect.light).highlightColor },
          ]}
        />
      )}
      {children}
    </View>
  );
}

interface StoryCardProps {
  title: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  duration: number;
  coverColor?: string;
  coverUrl?: string;
  onPress: () => void;
  isPremium?: boolean;
  isAuthenticated?: boolean;
  isSubscribed?: boolean;
}

export function StoryCard({
  title,
  titleKey,
  description,
  descriptionKey,
  duration,
  coverColor,
  coverUrl,
  onPress,
  isPremium = false,
  isAuthenticated = false,
  isSubscribed = false,
}: StoryCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const translatedContent = useMemo(() => {
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      return `${mins}${t('story.minutes')}`;
    };

    const translatedTitle = titleKey ? (t(titleKey) !== titleKey ? t(titleKey) : title) : title;
    const translatedDesc = descriptionKey
      ? t(descriptionKey) !== descriptionKey
        ? t(descriptionKey)
        : description
      : description;

    return {
      formattedDuration: formatDuration(duration),
      translatedTitle,
      translatedDesc,
    };
  }, [title, titleKey, description, descriptionKey, duration, t]);

  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
    }),
    [colors.surface],
  );

  const coverStyle = useMemo(
    () => ({
      backgroundColor: coverColor || colors.primary,
    }),
    [coverColor, colors.primary],
  );

  return (
    <TouchableOpacity style={[styles.storyCard, cardStyle]} onPress={onPress}>
      <View style={[styles.storyCover, coverStyle]}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.storyCoverImage} resizeMode="cover" />
        ) : (
          <BookOpen
            size={responsive.moderateScaleForIcon(iconSizes.xl)}
            color={colors.textPrimary}
          />
        )}
        {isPremium && !isSubscribed && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.success }]}>
            <Text style={[styles.premiumBadgeText, { color: commonColors.white }]}>
              {isAuthenticated ? t('story.openMembership') : t('story.loginToListen')}
            </Text>
          </View>
        )}
        <View style={styles.durationBadge}>
          <Clock size={responsive.moderateScaleForIcon(iconSizes.xs)} color={commonColors.white} />
          <Text style={[styles.duration, { color: commonColors.white }]}>
            {translatedContent.formattedDuration}
          </Text>
        </View>
      </View>
      <View style={styles.storyInfo}>
        <Text style={[styles.storyTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {translatedContent.translatedTitle}
        </Text>
        {translatedContent.translatedDesc && (
          <Text
            style={[styles.storyDesc, { color: colors.textSecondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {translatedContent.translatedDesc}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface DataCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: string;
  iconColor?: string;
}

export function DataCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon,
  iconColor,
}: DataCardProps) {
  const { colors } = useTheme();

  const trendConfig = useMemo(() => {
    let trendIcon: string;
    let trendColor: string;

    switch (trend) {
      case 'up':
        trendIcon = 'trending-up';
        trendColor = colors.success;
        break;
      case 'down':
        trendIcon = 'trending-down';
        trendColor = colors.error;
        break;
      default:
        trendIcon = 'remove';
        trendColor = colors.textSecondary;
    }

    return { trendIcon, trendColor };
  }, [trend, colors.success, colors.error, colors.textSecondary]);

  const iconComponent = useMemo(() => {
    const IconComp = cardIconMap[icon] || BookOpen;
    return (
      <IconComp size={responsive.moderateScaleForIcon(iconSizes.md)} color={colors.textPrimary} />
    );
  }, [icon, colors.textPrimary]);

  const trendIconComponent = useMemo(() => {
    if (!trend || !trendValue) return null;
    const IconComp = cardIconMap[trendConfig.trendIcon];
    return IconComp ? (
      <IconComp
        size={responsive.moderateScaleForIcon(iconSizes.sm)}
        color={trendConfig.trendColor}
      />
    ) : null;
  }, [trend, trendValue, trendConfig]);

  return (
    <View style={[styles.dataCard, { backgroundColor: colors.surface }]}>
      <View style={styles.dataTopRow}>
        <View style={[styles.dataIconContainer, { backgroundColor: iconColor || colors.primary }]}>
          {iconComponent}
        </View>
        <View style={styles.dataRight}>
          <View style={styles.dataValueRow}>
            <Text style={[styles.dataValue, { color: colors.textPrimary }]} numberOfLines={1}>
              {value}
            </Text>
            {unit && (
              <Text style={[styles.dataUnit, { color: colors.textSecondary }]} numberOfLines={1}>
                {unit}
              </Text>
            )}
          </View>
          {trend && trendValue && (
            <View style={styles.trendRow}>
              {trendIconComponent}
              <Text
                style={[styles.trendValue, { color: trendConfig.trendColor }]}
                numberOfLines={1}
              >
                {trendValue}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.dataTitle, { color: colors.textSecondary }]} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    position: 'relative',
  },
  dataCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  dataIconContainer: {
    alignItems: 'center',
    borderRadius: borderRadius.round,
    flexShrink: 0,
    height: responsive.moderateScale(40),
    justifyContent: 'center',
    width: responsive.moderateScale(40),
  },
  dataRight: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: spacing.sm,
  },
  dataTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  dataTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dataUnit: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginLeft: spacing.xs,
  },
  dataValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  dataValueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  duration: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    fontWeight: typography.fontWeight.semibold,
  },
  durationBadge: {
    alignItems: 'center',
    borderRadius: responsive.moderateScale(8),
    flexDirection: 'row',
    gap: responsive.moderateScale(3),
    left: undefined,
    paddingHorizontal: responsive.moderateScale(6),
    paddingVertical: responsive.verticalScale(3),
    position: 'absolute',
    right: responsive.moderateScale(8),
    top: responsive.verticalScale(8),
  },
  highlight: {
    height: 1,
    left: 0,
    opacity: 0.5,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  premiumBadge: {
    borderRadius: responsive.moderateScale(12),
    left: responsive.moderateScale(8),
    paddingHorizontal: responsive.moderateScale(8),
    paddingVertical: responsive.verticalScale(3),
    position: 'absolute',
    top: responsive.verticalScale(8),
  },
  premiumBadgeText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    fontWeight: typography.fontWeight.semibold,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  storyCard: {
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
    width: responsive.moderateScale(200),
  },
  storyCover: {
    alignItems: 'center',
    height: responsive.verticalScale(100),
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  storyCoverImage: {
    height: '100%',
    width: '100%',
  },
  storyDesc: {
    flexShrink: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    marginBottom: spacing.xs,
  },
  storyInfo: {
    padding: spacing.md,
  },
  storyTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  trendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: responsive.moderateScale(4),
    marginTop: spacing.xs,
  },
  trendValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
});
