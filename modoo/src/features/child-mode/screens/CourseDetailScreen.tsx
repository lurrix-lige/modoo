import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { ArrowLeft, Play, Check, Lock, Star, BookOpen, Clock, Trophy, CheckCircle, PlayCircle } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, sharedStyles } from '../../../theme';
import { ChildrenStackParamList } from '../../../navigation/types';
import { apiService, Course, Lesson } from '../../../services';
import { logger } from '../../../utils/logger';

type CourseDetailRouteProp = RouteProp<ChildrenStackParamList, 'CourseDetail'>;
type CourseDetailNavigationProp = NativeStackNavigationProp<ChildrenStackParamList, 'CourseDetail'>;

export default function CourseDetailScreen() {
  const navigation = useNavigation<CourseDetailNavigationProp>();
  const route = useRoute<CourseDetailRouteProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
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

  const handleLessonPress = async (lesson: Lesson) => {
    if (lesson.isCompleted) {
      return;
    }
    
    try {
      await apiService.completeLesson(lesson.id);
      await loadCourseData();
      navigation.navigate('CourseLearning', { lessonId: lesson.id });
    } catch (error) {
      Alert.alert(t('common.error'), t('course.completeFailed'));
    }
  };

  const handleContinueLearning = () => {
    const firstUncompletedLesson = lessons.find(lesson => !lesson.isCompleted);
    if (firstUncompletedLesson) {
      handleLessonPress(firstUncompletedLesson);
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
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('course.courseDetail')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.courseHeader, { backgroundColor: colors.surface }]}>
          <View style={[styles.courseImage, { backgroundColor: colors.primary }]}>
            <Text style={[styles.courseLevel, { color: commonColors.white }]}>Level {course.level}</Text>
          </View>
          <Text style={[styles.courseName, { color: colors.textPrimary }]}>
            {course.nameKey ? (t(course.nameKey) !== course.nameKey ? t(course.nameKey) : course.name) : course.name}
          </Text>
          <Text style={[styles.courseDesc, { color: colors.textSecondary }]}>
            {course.descriptionKey ? (t(course.descriptionKey) !== course.descriptionKey ? t(course.descriptionKey) : course.description) : course.description}
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
            disabled={lesson.isCompleted}
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
                {lesson.titleKey ? (t(lesson.titleKey) !== lesson.titleKey ? t(lesson.titleKey) : (lesson.title || lesson.name)) : (lesson.title || lesson.name)}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
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
});
