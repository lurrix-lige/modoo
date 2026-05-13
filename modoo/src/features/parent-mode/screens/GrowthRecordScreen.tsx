import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { ArrowLeft, Trophy, Flame, BookOpen, Calendar, TrendingUp, Award, Star, RotateCw } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles } from '../../../theme';
import { ParentStackParamList } from '../../../navigation/types';
import { useAppStore } from '../../../store';
import { apiService, type StoryStatsResponse, type CheckInResponse } from '../../../services';
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
  'book': BookOpen,
  'flame': Flame,
  'trophy': Trophy,
  'calendar': Calendar,
  'trending-up': TrendingUp,
  'star': Star,
  'award': Award,
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
    const validEntries = history.filter(h => h.quality > 0);
    if (validEntries.length === 0) return 0;
    const avgQuality = validEntries.reduce((acc, h) => acc + (h.quality || 0), 0) / validEntries.length;
    return Math.round(avgQuality * 20);
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError({ hasError: false, message: '' });

    try {
      const [streakResponse, history, coursesResponse, storyStats] = await Promise.all([
        apiService.getStreak(),
        apiService.getCheckInHistory(),
        apiService.getCourses(),
        apiService.getStoryStats(),
      ]);

      const coursesProgress = (coursesResponse?.courses || []).map(course => ({
        name: course.name,
        progress: (course.totalLessons || 0) > 0
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
        message: t('common.error.loadFailed'),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [calculateSleepQuality, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const handleRetry = useCallback(() => {
    loadData(false);
  }, [loadData]);

  const renderStatCard = (title: string, value: string | number, icon: string, color: string, key: string) => (
    <View key={key} style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {(() => { const IconComp = growthIconMap[icon] || BookOpen; return <IconComp size={24} color={color} />; })()}
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={2}>{title}</Text>
    </View>
  );

  const renderProgressBar = (name: string, progress: number, color: string, key: string) => (
    <View key={key} style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressName, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
        <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>{progress}%</Text>
      </View>
      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressBarFill,
            { backgroundColor: color, width: `${progress}%` },
          ]}
        />
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
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleRetry}>
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
          {renderStatCard(t('common.storyCompleted'), progressData.storiesCompleted, 'book', colors.primary, 'story')}
          {renderStatCard(t('common.checkInDays'), progressData.checkInStreak, 'flame', colors.warning, 'streak')}
          {renderStatCard(t('common.totalRecords'), progressData.totalDays, 'calendar', colors.secondary, 'total')}
          {renderStatCard(t('common.sleepQuality'), `${progressData.sleepQuality}%`, 'star', colors.info, 'quality')}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('common.growthRecord.courseProgress')}
          </Text>
          {progressData.coursesProgress.length > 0 ? (
            progressData.coursesProgress.map((course, index) => (
              renderProgressBar(
                course.name,
                course.progress,
                [colors.primary, colors.secondary, colors.warning][index % 3],
                `course-${index}`
              )
            ))
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
                <Text style={[styles.milestoneTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {t('common.growthRecord.firstCheckIn')}
                </Text>
                <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {t('common.growthRecord.firstCheckInDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.milestoneItem}>
              <View style={[styles.milestoneIcon, { backgroundColor: colors.warning + '20' }]}>
                <Flame size={20} color={colors.warning} />
              </View>
              <View style={styles.milestoneContent}>
                <Text style={[styles.milestoneTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {t('common.growthRecord.sevenDayStreak')}
                </Text>
                <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {t('common.growthRecord.sevenDayStreakDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.milestoneItem}>
              <View style={[styles.milestoneIcon, { backgroundColor: colors.primary + '20' }]}>
                <BookOpen size={20} color={colors.primary} />
              </View>
              <View style={styles.milestoneContent}>
                <Text style={[styles.milestoneTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {t('common.growthRecord.tenStories')}
                </Text>
                <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]} numberOfLines={2}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
  },
  placeholder: {
    width: 40,
  },
  childInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: commonColors.white,
  },
  childName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  childDesc: {
    fontSize: typography.fontSize.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.small,
    minHeight: 140,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  progressItem: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    marginRight: spacing.sm,
  },
  progressPercent: {
    fontSize: typography.fontSize.sm,
    flexShrink: 0,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  milestoneList: {},
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  milestoneDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  retryText: {
    color: commonColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
});