import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme, spacing, borderRadius } from '../../theme';
import { useResponsive } from '../../hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ContentSkeleton() {
  const { colors } = useTheme();
  const { getContentCardWidth, getContentLimit, isTablet } = useResponsive();
  const skeletonCount = getContentLimit();

  return (
    <View style={styles.container}>
      <View style={[styles.heroSkeleton, { backgroundColor: colors.surface }]} />

      <View style={styles.contentSection}>
        <View style={[styles.titleSkeleton, { backgroundColor: colors.surface }]} />
        <View style={[
          styles.cardRow,
          { gap: isTablet ? spacing.lg : spacing.md }
        ]}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.cardSkeleton,
                { 
                  backgroundColor: colors.surface,
                  width: getContentCardWidth(),
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.featuresSection}>
        <View style={[styles.titleSkeleton, { backgroundColor: colors.surface }]} />
        <View style={[
          styles.featuresGrid,
          { gap: isTablet ? spacing.lg : spacing.md }
        ]}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.featureSkeleton,
                { 
                  backgroundColor: colors.surface,
                  width: getContentCardWidth(),
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  heroSkeleton: {
    height: 200,
    borderRadius: borderRadius.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  contentSection: {
    marginBottom: spacing.xl,
  },
  titleSkeleton: {
    height: 24,
    width: SCREEN_WIDTH * 0.4,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardSkeleton: {
    height: 180,
    borderRadius: borderRadius.lg,
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureSkeleton: {
    height: 140,
    borderRadius: borderRadius.lg,
  },
});
