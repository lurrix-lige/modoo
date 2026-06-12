import { apiService, CoursesResponse, Course } from '../ApiService';

export const courseApi = {
  getCourses: (): Promise<CoursesResponse> => apiService.getCourses(),
  getCourse: (courseId: string): Promise<Course> => apiService.getCourse(courseId),
  completeLesson: (lessonId: string): Promise<void> => apiService.completeLesson(lessonId),
};
