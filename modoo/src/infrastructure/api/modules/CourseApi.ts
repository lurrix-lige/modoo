import { apiService } from '../ApiService';
import type { CoursesResponse, Course } from '../types';

export const courseApi = {
  getCourses: () => apiService.get<CoursesResponse>('/courses'),
  getCourse: (courseId: string) => apiService.get<Course>(`/courses/${courseId}`),
  completeLesson: (lessonId: string) => apiService.post<void>(`/courses/lessons/${lessonId}/complete`),
};
