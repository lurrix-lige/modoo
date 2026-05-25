import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, responsive, iconSizes, typography, borderRadius } from '../../../theme';
import { Story } from '../../../types';
import GuardianSpirit, { GuardianIconType } from '../../../components/GuardianSpirit';

interface StoryInfoProps {
  story: Story & { isFavorite?: boolean };
  guardianIcon: GuardianIconType;
  guardianColor: string;
  onPrevStory?: () => void;
  onNextStory?: () => void;
  hasPrevStory?: boolean;
  hasNextStory?: boolean;
}

export const StoryInfo: React.FC<StoryInfoProps> = ({
  story,
  guardianIcon,
  guardianColor,
  onPrevStory,
  onNextStory,
  hasPrevStory = true,
  hasNextStory = true,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // 使用统一的尺寸预设：竖屏使用 lg (180)，横屏使用 md (140)
  const spiritSize = isLandscape ? 'md' : 'lg';

  return (
    <View style={[styles.playerSection, isLandscape && styles.landscapePlayerSection]}>
      <GuardianSpirit
        icon={guardianIcon}
        size={spiritSize}
        color={guardianColor}
        animated={true}
        animationType="breathe"
        style={[styles.avatarContainer, isLandscape && styles.landscapeAvatarContainer]}
      />

      <View style={[styles.storyInfo, isLandscape && styles.landscapeStoryInfo]}>
        <Text
          style={[
            styles.storyTitle,
            isLandscape && styles.landscapeStoryTitle,
            { color: colors.textPrimary },
          ]}
        >
          {story.title}
        </Text>
        <Text
          style={[
            styles.storyDesc,
            isLandscape && styles.landscapeStoryDesc,
            { color: colors.textSecondary },
          ]}
        >
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
            accessibilityLabel={t('storyPlayer.prevStory')}
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasPrevStory }}
          >
            <ChevronLeft
              size={responsive.moderateScaleForIcon(iconSizes.md)}
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
            accessibilityLabel={t('storyPlayer.nextStory')}
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasNextStory }}
          >
            <ChevronRight
              size={responsive.moderateScaleForIcon(iconSizes.md)}
              color={hasNextStory ? colors.textPrimary : colors.textDisabled}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  landscapeAvatarContainer: {
    marginBottom: 0,
  },
  landscapeNavButtons: {
    justifyContent: 'flex-start',
    marginTop: spacing.md,
  },
  landscapePlayerSection: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xl,
    paddingVertical: spacing.md,
  },
  landscapeStoryDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    lineHeight: responsive.verticalScale(20),
    textAlign: 'left',
  },
  landscapeStoryInfo: {
    alignItems: 'flex-start',
    flex: 1,
  },
  landscapeStoryTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xl),
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  navButton: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    height: responsive.moderateScale(40),
    justifyContent: 'center',
    width: responsive.moderateScale(40),
  },
  navButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  playerSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  storyDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    lineHeight: responsive.verticalScale(24),
    textAlign: 'center',
  },
  storyInfo: {
    alignItems: 'center',
  },
  storyTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});