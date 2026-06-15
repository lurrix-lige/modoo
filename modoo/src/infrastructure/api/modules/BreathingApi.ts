import { apiService } from '../ApiService';
import type {
  BreathingResponse,
  BreathingExerciseDetail,
  WhiteNoisesResponse,
  WhiteNoiseCategoriesResponse,
} from '../types';

export const breathingApi = {
  getBreathingExercises: () => apiService.get<BreathingResponse>('/breathing/exercises'),
  getBreathingExercise: (exerciseId: string) =>
    apiService.get<BreathingExerciseDetail>(`/breathing/exercises/${exerciseId}`),
  getWhiteNoises: () => apiService.get<WhiteNoisesResponse>('/breathing/white-noises'),
  getWhiteNoiseCategories: () =>
    apiService.get<WhiteNoiseCategoriesResponse>('/breathing/white-noises/categories'),
};
