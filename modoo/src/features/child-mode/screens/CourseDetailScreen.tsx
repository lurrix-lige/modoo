import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { Play, Check, Lock, Star, BookOpen, Clock, Trophy, CheckCircle, PlayCircle, ArrowLeft, Sun } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles } from '../../../theme';
import { ChildrenStackParamList } from '../../../navigation/types';
import { apiService, Course, Lesson } from '../../../services';
import { useCourseLocalization } from '../hooks/useCourseLocalization';
import { logger } from '../../../utils/logger';

type CourseDetailRouteProp = RouteProp<ChildrenStackParamList, 'CourseDetail'>;
type CourseDetailNavigationProp = NativeStackNavigationProp<ChildrenStackParamList, 'CourseDetail'>;

export default function CourseDetailScreen() {
  const navigation = useNavigation<CourseDetailNavigationProp>();
  const route = useRoute<CourseDetailRouteProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { getCourseName, getCourseDescription, getLessonTitle } = useCourseLocalization();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    loadCourseData();
  }, []);

  const loadCourseData = async () => {
    setIsLoading(true);
    try {
      const courseData = await apiService.getCourse(route.params?.courseId || '1');
      setCourse(courseData);
      setLessons(courseData.lessons || []);
    } catch (error) {
      logger.error('Failed to load course', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const courseData = await apiService.getCourse(route.params?.courseId || '1');
      setCourse(courseData);
      setLessons(courseData.lessons || []);
    } catch (error) {
      logger.error('Failed to refresh course', { error });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLessonPress = async (lesson: Lesson) => {
    navigation.navigate('CourseLearning', {
      lessonId: lesson.id,
      courseId: route.params.courseId,
      backgroundMusicUrl: lesson.backgroundMusicUrl,
      voiceGuideUrl: lesson.voiceGuideUrl,
      contentUrl: lesson.contentUrl,
      lessonTitle: getLessonTitle(lesson),
      lessonDuration: lesson.duration,
    });
  };

  const handleContinueLearning = () => {
    // 找到第一个未完成的课程，如果都完成了就找第一个
    const targetLesson = lessons.find(lesson => !lesson.isCompleted) || lessons[0];
    if (targetLesson) {
      handleLessonPress(targetLesson);
    } else {
      Alert.alert(t('course.congratulations'), t('course.allLessonsCompleted'));
    }
  };

  if (isLoading || !course) {
    return (
      <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('course.courseDetail')}</Text>
          <View style={styles.headerRight}>
            <Sun size={24} color={colors.textPrimary} />
          </View>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.skeletonHero, { backgroundColor: colors.surface }]}>
            <View style={[styles.skeletonCircle, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonTextLg, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonTextMd, { backgroundColor: colors.border }]} />
            <View style={styles.skeletonStatsRow}>
              {[1, 2, 3].map(i => (
                <View key={i} style={[styles.skeletonTextSm, { backgroundColor: colors.border }]} />
              ))}
            </View>
          </View>
          <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.skeletonLessonCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.skeletonLessonNum, { backgroundColor: colors.border }]} />
              <View style={styles.skeletonLessonInfo}>
                <View style={[styles.skeletonTextMd, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonTextSm, { backgroundColor: colors.border }]} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaContainer>
    );
  }

  return (
    <SafeAreaContainer style={[sharedStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('course.courseDetail')}</Text>
        <View style={styles.headerRight}>
          <Sun size={24} color={colors.textPrimary} />
        </View>
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
        <View style={[styles.courseHeader, { backgroundColor: colors.surface }]}>
          <View style={[styles.courseImage, { backgroundColor: colors.primary }]}>
            <Text style={[styles.courseLevel, { color: commonColors.white }]}>Level {course.level}</Text>
          </View>
          <Text style={[styles.courseName, { color: colors.textPrimary }]}>
            {getCourseName(course)}
          </Text>
          <Text style={[styles.courseDesc, { color: colors.textSecondary }]}>
            {getCourseDescription(course)}
          </Text>

          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <BookOpen size={20} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textPrimary }]}>
                {course.totalLessons}{t('course.lessons')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={20} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textPrimary }]}>
                {lessons.reduce((acc, lesson) => acc + lesson.duration, 0)}{t('course.minutes')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Trophy size={20} color={colors.warning} />
              <Text style={[styles.statText, { color: colors.textPrimary }]}>
                {Math.floor(((course.completedLessons || 0) / (course.totalLessons || 1) * 100))}%
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('course.courseContent')}</Text>

        {lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonCard, { backgroundColor: colors.surface }]}
                onPress={() => handleLessonPress(lesson)}
              >
                <View
                  style={[
                    styles.lessonNumber,
                    { backgroundColor: lesson.isCompleted ? colors.success : colors.primary },
                  ]}
                >
                  {lesson.isCompleted ? (
                    <Check size={16} color={commonColors.white} />
                  ) : (
                    <Text style={[styles.lessonNumberText, { color: commonColors.white }]}>{index + 1}</Text>
                  )}
                </View>

                <View style={styles.lessonInfo}>
                  <Text style={[styles.lessonName, { color: colors.textPrimary }]}>
                    {getLessonTitle(lesson)}
                  </Text>
                  <Text style={[styles.lessonDuration, { color: colors.textSecondary }]}>
                    {lesson.duration}{t('course.minutes')}
                  </Text>
                </View>

                {lesson.isCompleted ? <CheckCircle size={28} color={colors.success} /> : <PlayCircle size={28} color={colors.primary} />}
              </TouchableOpacity>
            ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[styles.continueButton, { backgroundColor: colors.primary }]} onPress={handleContinueLearning}>
          <Play size={24} color={commonColors.white} />
          <Text style={[styles.continueButtonText, { color: commonColors.white }]}>
            {course.completedLessons && course.completedLessons > 0 ? t('course.continueLearning') : t('course.startLearning')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
  },
  header: {
    ...sharedStyles.rowBetween,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerRight: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  courseHeader: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  courseImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  courseLevel: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  courseName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  courseDesc: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  courseStats: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  lessonNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  lessonNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  lessonDuration: {
    fontSize: typography.fontSize.xs,
  },
  footer: {
    padding: spacing.xl,
    ...shadows.small,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  continueButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  // Skeleton styles
  skeletonHero: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  skeletonCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.lg,
  },
  skeletonTextLg: {
    width: '60%',
    height: 24,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  skeletonTextMd: {
    width: '80%',
    height: 16,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  skeletonTextSm: {
    width: 60,
    height: 14,
    borderRadius: 7,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  skeletonTitle: {
    width: 120,
    height: 20,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  skeletonLessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  skeletonLessonNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.md,
  },
  skeletonLessonInfo: {
    flex: 1,
  },
});
