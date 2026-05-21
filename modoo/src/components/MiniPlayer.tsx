import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Pause, Play, SkipBack, SkipForward, Moon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors } from '../theme';

interface MiniPlayerProps {
  title: string;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  onPress: () => void;
}

export function MiniPlayer({ title, isPlaying, progress, onPlayPause, onPress }: MiniPlayerProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.leftSection}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
          <Moon size={20} color={commonColors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('story.playing')}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View
          style={[
            styles.glowIndicator,
            {
              backgroundColor: isPlaying ? colors.primary : 'transparent',
              boxShadow: isPlaying ? `0 0 8px 8px ${colors.primary}` : 'none',
            },
          ]}
        />
        <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
          {isPlaying ? (
            <Pause size={24} color={colors.primary} />
          ) : (
            <Play size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  container: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  glowIndicator: {
    borderRadius: 4,
    height: 8,
    marginRight: spacing.md,
    width: 8,
  },
  leftSection: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  playButton: {
    padding: spacing.xs,
  },
  progressBar: {
    bottom: 0,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  progressFill: {
    height: '100%',
  },
  rightSection: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
});
