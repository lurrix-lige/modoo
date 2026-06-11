import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme, spacing, borderRadius } from '../../theme';
import { useResponsive } from '../../hooks';

export function ContentSkeleton() {
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const { getContentCardWidth, getContentLimit, isTablet } = useResponsive();
  const skeletonCount = getContentLimit();

  return (
    <View style={styles.container}>
      <View style={[styles.heroSkeleton, { backgroundColor: colors.surface }]} />

      <View style={styles.contentSection}>
        <View style={[styles.titleSkeleton, { backgroundColor: colors.surface, width: screenWidth * 0.4 }]} />
        <View style={[styles.cardRow, { gap: isTablet ? spacing.lg : spacing.md }]}>
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
        <View style={[styles.featuresGrid, { gap: isTablet ? spacing.lg : spacing.md }]}>
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
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cardSkeleton: {
    borderRadius: borderRadius.lg,
    height: 180,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  contentSection: {
    marginBottom: spacing.xl,
  },
  featureSkeleton: {
    borderRadius: borderRadius.lg,
    height: 140,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  heroSkeleton: {
    borderRadius: borderRadius.xl,
    height: 200,
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  titleSkeleton: {
    borderRadius: borderRadius.md,
    height: 24,
    marginBottom: spacing.lg,
  },
});
