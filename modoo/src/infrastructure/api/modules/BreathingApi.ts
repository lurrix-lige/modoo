import { apiService, BreathingResponse, BreathingExerciseDetail, WhiteNoisesResponse, WhiteNoiseCategoriesResponse } from '../ApiService';

export const breathingApi = {
  getBreathingExercises: (): Promise<BreathingResponse> => apiService.getBreathingExercises(),
  getBreathingExercise: (exerciseId: string): Promise<BreathingExerciseDetail> =>
    apiService.getBreathingExercise(exerciseId),
  getWhiteNoises: (): Promise<WhiteNoisesResponse> => apiService.getWhiteNoises(),
  getWhiteNoiseCategories: (): Promise<WhiteNoiseCategoriesResponse> =>
    apiService.getWhiteNoiseCategories(),
};
