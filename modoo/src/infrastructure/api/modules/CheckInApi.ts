import { apiService, CheckInRequest, CheckInResponse, StreakResponse, SleepStatsResponse } from '../ApiService';

export const checkInApi = {
  checkIn: (data: CheckInRequest): Promise<CheckInResponse> => apiService.checkIn(data),
  getStreak: (): Promise<StreakResponse> => apiService.getStreak(),
  getCheckInHistory: (): Promise<CheckInResponse[]> => apiService.getCheckInHistory(),
  getTodayCheckIn: (): Promise<CheckInResponse | null> => apiService.getTodayCheckIn(),
  getSleepStats: (period: 'week' | 'month' = 'week'): Promise<SleepStatsResponse> =>
    apiService.getSleepStats(period),
};
