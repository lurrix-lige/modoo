import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  BookOpen,
  Play,
  Lock,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Trophy,
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
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
import { ChildrenStackParamList } from '../../../navigation/types';
import { AuthModal } from '../../../features/auth';
import { useAppStore } from '../../../store';
import { apiService, Course } from '../../../services';
import { useCourseLocalization } from '../hooks/useCourseLocalization';
import { logger } from '../../../utils/logger';

type CourseScreenNavigationProp = NativeStackNavigationProp<ChildrenStackParamList>;

export default function CourseScreen() {
  const navigation = useNavigation<CourseScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAppStore();
  const { getCourseName, getCourseDescription } = useCourseLocalization();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [isLockedCourse, setIsLockedCourse] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isAuthenticated && pendingCourseId) {
      navigation.navigate('CourseDetail', { courseId: pendingCourseId });
      setPendingCourseId(null);
    }
  }, [isAuthenticated, pendingCourseId, navigation]);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await apiService.getCourses();
      setCourses(response.courses);
    } catch (error) {
      logger.error('Failed to load course data', { error });
      setLoadError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const response = await apiService.getCourses();
      setCourses(response.courses);
    } catch (error) {
      logger.error('Failed to refresh courses', { error });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getLevelStars = (completed: number, total: number) => {
    const progress = total > 0 ? (completed / total) * 100 : 0;
    if (progress >= 100) return '★★★★★';
    if (progress >= 80) return '★★★★';
    if (progress >= 60) return '★★★☆';
    if (progress >= 40) return '★★☆☆';
    if (progress >= 20) return '★☆☆☆';
    return '☆☆☆☆';
  };

  const completedCourses = courses.filter(
    (c) => c.completedLessons && c.completedLessons >= c.totalLessons,
  );
  const currentLevel =
    completedCourses.length > 0 ? Math.max(...completedCourses.map((c) => c.level)) : 1;
  const earnedBadges = completedCourses.length;

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonLevelOverview}>
        <View style={[styles.skeletonLevelCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonTextShort, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
        </View>
        <View style={[styles.skeletonLevelCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonTextShort, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
        </View>
      </View>

      <View style={styles.skeletonSectionTitle}>
        <View style={[styles.skeletonTextMedium, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.skeletonCourses}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.skeletonCourseCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.skeletonCourseImage, { backgroundColor: colors.border }]} />
            <View style={styles.skeletonCourseInfo}>
              <View style={[styles.skeletonTextLong, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonTextShort, { backgroundColor: colors.border }]} />
              <View style={styles.skeletonProgressRow}>
                <View style={[styles.skeletonProgressBar, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonTextTiny, { backgroundColor: colors.border }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const handleCoursePress = (courseId: string, isLocked: boolean) => {
    if (isLocked) {
      setIsLockedCourse(true);
      setPendingCourseId(courseId);
      setShowAuthModal(true);
      return;
    }

    navigation.navigate('CourseDetail', { courseId });
  };

  const handleLogin = () => {
    setShowAuthModal(false);
    navigation.getParent()?.navigate('Auth', { fromScreen: 'Course' });
  };

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('course.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('course.subtitle')}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading ? (
          renderLoadingSkeleton()
        ) : loadError ? (
          <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{loadError}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadData}
            >
              <Text style={[styles.retryButtonText, { color: commonColors.white }]}>
                {t('common.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.levelOverview}>
              <View style={[styles.levelCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.levelIcon, { backgroundColor: colors.primary }]}>
                  <GraduationCap
                    size={responsive.moderateScaleForIcon(iconSizes.lg)}
                    color={commonColors.white}
                  />
                </View>
                <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>
                  {t('course.currentProgress')}
                </Text>
                <Text style={[styles.levelValue, { color: colors.textPrimary }]}>
                  {t('course.level', { level: currentLevel })}
                </Text>
              </View>

              <View style={[styles.levelCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.levelIcon, { backgroundColor: colors.warning }]}>
                  <Trophy
                    size={responsive.moderateScaleForIcon(iconSizes.lg)}
                    color={commonColors.white}
                  />
                </View>
                <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>
                  {t('course.earnedBadges')}
                </Text>
                <Text style={[styles.levelValue, { color: colors.textPrimary }]}>
                  {earnedBadges} {t('course.piece')}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('course.desensitizationLevels')}
            </Text>

            {courses.map((course) => {
              const isLocked = !course.isUnlocked;
              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.courseCard, { backgroundColor: colors.surface }]}
                  onPress={() => handleCoursePress(course.id, isLocked)}
                >
                  <View
                    style={[
                      styles.courseImage,
                      { backgroundColor: isLocked ? colors.secondary : colors.primary },
                    ]}
                  >
                    {isLocked ? (
                      <Lock
                        size={responsive.moderateScaleForIcon(iconSizes.lg)}
                        color={commonColors.white}
                      />
                    ) : (
                      <Text style={[styles.courseLevel, { color: commonColors.white }]}>
                        {course.level}
                      </Text>
                    )}
                  </View>

                  <View style={styles.courseInfo}>
                    <Text style={[styles.courseName, { color: colors.textPrimary }]}>
                      {getCourseName(course)}
                    </Text>
                    <Text style={[styles.courseDesc, { color: colors.textSecondary }]}>
                      {getCourseDescription(course)}
                    </Text>

                    <View style={styles.courseProgress}>
                      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: colors.primary,
                              width: `${((course.completedLessons || 0) / (course.totalLessons || 1)) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                        {course.completedLessons}/{course.totalLessons}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.courseStars}>
                    <Text style={[styles.stars, { color: colors.warning }]}>
                      {getLevelStars(course.completedLessons || 0, course.totalLessons || 1)}
                    </Text>
                  </View>

                  <ChevronRight
                    size={responsive.moderateScaleForIcon(iconSizes.md)}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <AuthModal
        visible={showAuthModal}
        onLogin={handleLogin}
        onDismiss={() => {
          setShowAuthModal(false);
          setPendingCourseId(null);
          setIsLockedCourse(false);
        }}
        title={isLockedCourse ? t('course.unlockCourse') : t('course.loginToAccess')}
        message={isLockedCourse ? t('course.lockedCourseMessage') : t('course.loginMessage')}
      />
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  levelOverview: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  levelCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flex: 1,
    padding: spacing.lg,
    ...shadows.small,
  },
  levelIcon: {
    alignItems: 'center',
    borderRadius: responsive.moderateScale(24),
    height: responsive.moderateScale(48),
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: responsive.moderateScale(48),
  },
  levelLabel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
  },
  levelValue: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  courseCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.small,
  },
  courseImage: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    height: responsive.moderateScale(60),
    justifyContent: 'center',
    marginRight: spacing.md,
    width: responsive.moderateScale(60),
  },
  courseLevel: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xxl),
    fontWeight: typography.fontWeight.bold,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  courseDesc: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    marginBottom: spacing.sm,
  },
  courseProgress: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressBar: {
    borderRadius: responsive.moderateScale(3),
    flex: 1,
    height: responsive.verticalScale(6),
  },
  progressFill: {
    borderRadius: responsive.moderateScale(3),
    height: '100%',
  },
  progressText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    minWidth: responsive.moderateScale(40),
  },
  courseStars: {
    marginHorizontal: spacing.sm,
  },
  stars: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },

  // Skeleton styles
  skeletonContent: {
    flex: 1,
  },
  skeletonLevelOverview: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  skeletonLevelCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flex: 1,
    padding: spacing.lg,
  },
  skeletonIcon: {
    borderRadius: responsive.moderateScale(24),
    height: responsive.moderateScale(48),
    marginBottom: spacing.sm,
    width: responsive.moderateScale(48),
  },
  skeletonTextShort: {
    borderRadius: responsive.moderateScale(7),
    height: responsive.verticalScale(14),
    marginTop: spacing.sm,
    width: responsive.moderateScale(60),
  },
  skeletonTextMedium: {
    borderRadius: responsive.moderateScale(9),
    height: responsive.verticalScale(18),
    marginTop: spacing.xs,
    width: responsive.moderateScale(100),
  },
  skeletonTextLong: {
    borderRadius: responsive.moderateScale(8),
    height: responsive.verticalScale(16),
    marginBottom: spacing.xs,
    width: '80%',
  },
  skeletonTextTiny: {
    borderRadius: responsive.moderateScale(6),
    height: responsive.verticalScale(12),
    width: responsive.moderateScale(40),
  },
  skeletonSectionTitle: {
    marginBottom: spacing.md,
  },
  skeletonCourses: {
    gap: spacing.md,
  },
  skeletonCourseCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    padding: spacing.md,
  },
  skeletonCourseImage: {
    borderRadius: borderRadius.md,
    height: responsive.moderateScale(60),
    marginRight: spacing.md,
    width: responsive.moderateScale(60),
  },
  skeletonCourseInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonProgressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skeletonProgressBar: {
    borderRadius: responsive.moderateScale(3),
    flex: 1,
    height: responsive.verticalScale(6),
  },

  // Error state
  errorCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    marginTop: spacing.xl,
    padding: spacing.xxl,
    ...shadows.medium,
  },
  errorText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryButtonText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
    fontWeight: typography.fontWeight.semibold,
  },
});
