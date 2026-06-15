import { apiService } from '../ApiService';
import type { CheckInRequest, CheckInResponse, StreakResponse, SleepStatsResponse } from '../types';

export const checkInApi = {
  checkIn: (data: CheckInRequest) => apiService.post<CheckInResponse>('/checkin', data),
  getStreak: () => apiService.get<StreakResponse>('/checkin/streak', true),
  getCheckInHistory: () => apiService.get<CheckInResponse[]>('/checkin/history', true),
  getTodayCheckIn: async (): Promise<CheckInResponse | null> => {
    try {
      return await apiService.get<CheckInResponse>('/checkin/today', true);
    } catch {
      return null;
    }
  },
  getSleepStats: (period: 'week' | 'month' = 'week') =>
    apiService.get<SleepStatsResponse>(`/checkin/stats?period=${period}`),
};
