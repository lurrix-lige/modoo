import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import { useTheme, spacing, responsive, iconSizes, shadows, commonColors } from '../../../theme';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentProgress: number;
  maxDuration: number;
  onPlayToggle: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentProgress,
  maxDuration,
  onPlayToggle,
  onSkipBackward,
  onSkipForward,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <View style={[styles.controlsSection, isLandscape && styles.landscapeControlsSection]}>
      <TouchableOpacity
        style={[styles.controlButton, isLandscape && styles.landscapeControlButton]}
        onPress={onSkipBackward}
        disabled={disabled || currentProgress <= 0}
      >
        <SkipBack
          size={responsive.moderateScale(isLandscape ? iconSizes.lg : iconSizes.xl)}
          color={disabled || currentProgress <= 0 ? colors.textDisabled : colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.playButton, isLandscape && styles.landscapePlayButton, { backgroundColor: colors.primary }]}
        onPress={onPlayToggle}
        disabled={disabled}
      >
        {isPlaying ? (
          <Pause
            size={responsive.moderateScale(isLandscape ? iconSizes.xl : iconSizes.xxl)}
            color={commonColors.white}
          />
        ) : (
          <Play
            size={responsive.moderateScale(isLandscape ? iconSizes.xl : iconSizes.xxl)}
            color={commonColors.white}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, isLandscape && styles.landscapeControlButton]}
        onPress={onSkipForward}
        disabled={disabled || currentProgress >= maxDuration}
      >
        <SkipForward
          size={responsive.moderateScale(isLandscape ? iconSizes.lg : iconSizes.xl)}
          color={disabled || currentProgress >= maxDuration ? colors.textDisabled : colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  landscapeControlsSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  controlButton: {
    padding: spacing.md,
  },
  landscapeControlButton: {
    padding: spacing.sm,
  },
  playButton: {
    width: responsive.moderateScale(80),
    height: responsive.moderateScale(80),
    borderRadius: responsive.moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  landscapePlayButton: {
    width: responsive.moderateScale(64),
    height: responsive.moderateScale(64),
    borderRadius: responsive.moderateScale(32),
  },
});