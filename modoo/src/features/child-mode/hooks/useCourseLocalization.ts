import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface LocalizedCourse {
  name: string;
  nameKey?: string;
  level: number;
  description: string;
  descriptionKey?: string;
}

export interface LocalizedLesson {
  titleKey?: string;
  title?: string;
  name?: string;
}

export function useCourseLocalization() {
  const { t } = useTranslation();

  const getCourseName = useCallback((course: LocalizedCourse): string => {
    if (course.nameKey) {
      const translated = t(course.nameKey);
      if (translated !== course.nameKey) return translated;
    }
    const translated = t(`course.level${course.level}.title`);
    if (translated !== `course.level${course.level}.title`) return translated;
    return course.name;
  }, [t]);

  const getCourseDescription = useCallback((course: LocalizedCourse): string => {
    if (course.descriptionKey) {
      const translated = t(course.descriptionKey);
      if (translated !== course.descriptionKey) return translated;
    }
    const translated = t(`course.level${course.level}.desc`);
    if (translated !== `course.level${course.level}.desc`) return translated;
    return course.description;
  }, [t]);

  const getLessonTitle = useCallback((lesson: LocalizedLesson): string => {
    if (lesson.titleKey) {
      const translated = t(lesson.titleKey);
      if (translated !== lesson.titleKey) return translated;
    }
    return lesson.title || lesson.name || '';
  }, [t]);

  return { getCourseName, getCourseDescription, getLessonTitle };
}
