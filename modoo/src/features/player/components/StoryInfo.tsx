import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme, spacing, responsive, iconSizes, typography, borderRadius } from '../../../theme';
import { Story } from '../../../types';
import GuardianSpirit, { GuardianIconType } from '../../../components/GuardianSpirit';

interface StoryInfoProps {
  story: Story & { isFavorite?: boolean };
  guardianIcon: GuardianIconType;
  onPrevStory?: () => void;
  onNextStory?: () => void;
  hasPrevStory?: boolean;
  hasNextStory?: boolean;
}

export const StoryInfo: React.FC<StoryInfoProps> = ({
  story,
  guardianIcon,
  onPrevStory,
  onNextStory,
  hasPrevStory = true,
  hasNextStory = true,
}) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // 计算尺寸：竖�?180x180，横�?120x120
  const avatarSize = responsive.moderateScale(isLandscape ? 120 : 180);
  // 内层尺寸比例�?50/180 = 0.833�?00/120 = 0.833
  const innerSizeRatio = 0.833;
  // 图标尺寸
  const iconSize = responsive.moderateScale(iconSizes.hero);

  return (
    <View style={[styles.playerSection, isLandscape && styles.landscapePlayerSection]}>
      <GuardianSpirit
        icon={guardianIcon}
        size={avatarSize}
        color={colors.primary}
        innerColor={colors.primaryDark}
        innerSizeRatio={innerSizeRatio}
        iconSize={iconSize}
        animated={true}
        animationType="breathe"
        style={[styles.avatarContainer, isLandscape && styles.landscapeAvatarContainer]}
      />

      <View style={[styles.storyInfo, isLandscape && styles.landscapeStoryInfo]}>
        <Text style={[styles.storyTitle, isLandscape && styles.landscapeStoryTitle, { color: colors.textPrimary }]}>
          {story.title}
        </Text>
        <Text style={[styles.storyDesc, isLandscape && styles.landscapeStoryDesc, { color: colors.textSecondary }]}>
          {story.description}
        </Text>

        <View style={[styles.navButtons, isLandscape && styles.landscapeNavButtons]}>
          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor: hasPrevStory ? colors.surfaceVariant : colors.surface,
                borderColor: colors.border,
                opacity: hasPrevStory ? 1 : 0.5,
              },
            ]}
            onPress={onPrevStory}
            disabled={!hasPrevStory}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="上一个故事"
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasPrevStory }}
          >
            <ChevronLeft
              size={responsive.moderateScale(iconSizes.md)}
              color={hasPrevStory ? colors.textPrimary : colors.textDisabled}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              {
                backgroundColor: hasNextStory ? colors.surfaceVariant : colors.surface,
                borderColor: colors.border,
                opacity: hasNextStory ? 1 : 0.5,
              },
            ]}
            onPress={onNextStory}
            disabled={!hasNextStory}
            activeOpacity={0.8}
            accessible={true}
            accessibilityLabel="下一个故事"
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasNextStory }}
          >
            <ChevronRight
              size={responsive.moderateScale(iconSizes.md)}
              color={hasNextStory ? colors.textPrimary : colors.textDisabled}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  playerSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  landscapePlayerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  landscapeAvatarContainer: {
    marginBottom: 0,
  },
  storyInfo: {
    alignItems: 'center',
  },
  landscapeStoryInfo: {
    alignItems: 'flex-start',
    flex: 1,
  },
  storyTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  landscapeStoryTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    textAlign: 'left',
    marginBottom: spacing.xs,
  },
  storyDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    textAlign: 'center',
    lineHeight: responsive.verticalScale(24),
  },
  landscapeStoryDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    textAlign: 'left',
    lineHeight: responsive.verticalScale(20),
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  landscapeNavButtons: {
    marginTop: spacing.md,
    justifyContent: 'flex-start',
  },
  navButton: {
    width: responsive.moderateScale(40),
    height: responsive.moderateScale(40),
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
