import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import {
  ArrowLeft,
  Trophy,
  Flame,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  Star,
  RotateCw,
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
} from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { useAppStore } from '../../../store';
import { type StoryStatsResponse, type CheckInResponse } from '../../../services';
import { checkInApi, courseApi, storyApi } from '../../../infrastructure/api';
import { LoadingState } from '../../../components';
import { logger } from '../../../utils/logger';

type GrowthRecordNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'GrowthRecord'>;

interface ProgressData {
  storiesCompleted: number;
  coursesProgress: { name: string; progress: number }[];
  checkInStreak: number;
  totalDays: number;
  longestStreak: number;
  sleepQuality: number;
}

interface ErrorState {
  hasError: boolean;
  message: string;
}

const growthIconMap: Record<string, any> = {
  book: BookOpen,
  flame: Flame,
  trophy: Trophy,
  calendar: Calendar,
  'trending-up': TrendingUp,
  star: Star,
  award: Award,
};

export default function GrowthRecordScreen() {
  const navigation = useNavigation<GrowthRecordNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { child } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState>({ hasError: false, message: '' });
  const [progressData, setProgressData] = useState<ProgressData>({
    storiesCompleted: 0,
    coursesProgress: [],
    checkInStreak: 0,
    totalDays: 0,
    longestStreak: 0,
    sleepQuality: 0,
  });

  const calculateSleepQuality = useCallback((history: CheckInResponse[]): number => {
    if (!history || history.length === 0) return 0;
    const validEntries = history.filter((h) => h.quality > 0);
    if (validEntries.length === 0) return 0;
    const avgQuality =
      validEntries.reduce((acc, h) => acc + (h.quality || 0), 0) / validEntries.length;
    return Math.round(avgQuality * 20);
  }, []);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError({ hasError: false, message: '' });

      try {
        const [streakResponse, history, coursesResponse, storyStats] = await Promise.all([
          checkInApi.getStreak(),
          checkInApi.getCheckInHistory(),
          courseApi.getCourses(),
          storyApi.getStoryStats(),
        ]);

        const coursesProgress = (coursesResponse?.courses || []).map((course) => ({
          name: course.name,
          progress:
            (course.totalLessons || 0) > 0
              ? Math.round(((course.completedLessons || 0) / (course.totalLessons || 1)) * 100)
              : 0,
        }));

        setProgressData({
          storiesCompleted: storyStats?.storiesCompleted || 0,
          coursesProgress,
          checkInStreak: streakResponse?.streak || 0,
          totalDays: streakResponse?.totalDays || (history || []).length,
          longestStreak: streakResponse?.longestStreak || 0,
          sleepQuality: calculateSleepQuality(history || []),
        });
      } catch (err) {
        logger.error('Failed to load growth record', { error: err });
        setError({
          hasError: true,
          message: t('common.loadFailed'),
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [calculateSleepQuality, t],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const handleRetry = useCallback(() => {
    loadData(false);
  }, [loadData]);

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string,
    key: string,
  ) => (
    <View key={key} style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {(() => {
          const IconComp = growthIconMap[icon] || BookOpen;
          return <IconComp size={24} color={color} />;
        })()}
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );

  const renderProgressBar = (name: string, progress: number, color: string, key: string) => (
    <View key={key} style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressName, { color: colors.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>{progress}%</Text>
      </View>
      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
        <View style={[styles.progressBarFill, { backgroundColor: color, width: `${progress}%` }]} />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
        <LoadingState text={t('common.loading')} />
      </SafeAreaContainer>
    );
  }

  if (error.hasError) {
    return (
      <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('parentHome.growthFile')}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error.message}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRetry}
          >
            <RotateCw size={20} color={commonColors.white} />
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('parentHome.growthFile')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
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
        <View style={styles.childInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {child?.nickname?.charAt(0) || t('childProfile.defaultAvatar')}
            </Text>
          </View>
          <Text style={[styles.childName, { color: colors.textPrimary }]}>
            {child?.nickname || t('childProfile.baby')}
          </Text>
          <Text style={[styles.childDesc, { color: colors.textSecondary }]}>
            {t('common.growthRecord.growthEveryStep')}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {renderStatCard(
            t('common.storyCompleted'),
            progressData.storiesCompleted,
            'book',
            colors.primary,
            'story',
          )}
          {renderStatCard(
            t('common.checkInDays'),
            progressData.checkInStreak,
            'flame',
            colors.warning,
            'streak',
          )}
          {renderStatCard(
            t('common.totalRecords'),
            progressData.totalDays,
            'calendar',
            colors.secondary,
            'total',
          )}
          {renderStatCard(
            t('common.sleepQuality'),
            `${progressData.sleepQuality}%`,
            'star',
            colors.info,
            'quality',
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('common.growthRecord.courseProgress')}
          </Text>
          {progressData.coursesProgress.length > 0 ? (
            progressData.coursesProgress.map((course, index) =>
              renderProgressBar(
                course.name,
                course.progress,
                [colors.primary, colors.secondary, colors.warning][index % 3],
                `course-${index}`,
              ),
            )
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('common.growthRecord.noCourseRecord')}
            </Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('common.growthRecord.milestones')}
          </Text>
          <View style={styles.milestoneList}>
            <View style={styles.milestoneItem}>
              <View style={[styles.milestoneIcon, { backgroundColor: colors.success + '20' }]}>
                <Trophy size={20} color={colors.success} />
              </View>
              <View style={styles.milestoneContent}>
                <Text
                  style={[styles.milestoneTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {t('common.growthRecord.firstCheckIn')}
                </Text>
                <Text
                  style={[styles.milestoneDesc, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {t('common.growthRecord.firstCheckInDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.milestoneItem}>
              <View style={[styles.milestoneIcon, { backgroundColor: colors.warning + '20' }]}>
                <Flame size={20} color={colors.warning} />
              </View>
              <View style={styles.milestoneContent}>
                <Text
                  style={[styles.milestoneTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {t('common.growthRecord.sevenDayStreak')}
                </Text>
                <Text
                  style={[styles.milestoneDesc, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {t('common.growthRecord.sevenDayStreakDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.milestoneItem}>
              <View style={[styles.milestoneIcon, { backgroundColor: colors.primary + '20' }]}>
                <BookOpen size={20} color={colors.primary} />
              </View>
              <View style={styles.milestoneContent}>
                <Text
                  style={[styles.milestoneTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {t('common.growthRecord.tenStories')}
                </Text>
                <Text
                  style={[styles.milestoneDesc, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {t('common.growthRecord.tenStoriesDesc')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 80,
  },
  avatarText: {
    color: commonColors.white,
    fontSize: responsive.scaledFontSize(typography.fontSize.xxxl),
    fontWeight: typography.fontWeight.bold,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  childDesc: {
    fontSize: typography.fontSize.md,
  },
  childInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  childName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  emptyText: {
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
  },
  loadingText: {
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  milestoneIcon: {
    alignItems: 'center',
    borderRadius: 20,
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  milestoneItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  milestoneList: {},
  milestoneTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  placeholder: {
    width: 40,
  },
  progressBarBg: {
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    borderRadius: 4,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressItem: {
    marginBottom: spacing.md,
  },
  progressName: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.sm,
  },
  progressPercent: {
    flexShrink: 0,
    fontSize: typography.fontSize.sm,
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: {
    color: commonColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  section: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    ...shadows.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  statCard: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '47%',
    ...shadows.small,
    minHeight: 140,
  },
  statIcon: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 48,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
