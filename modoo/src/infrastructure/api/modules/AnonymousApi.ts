import { apiService } from '../ApiService';
import type {
  AnonymousGenerateResponse,
  AnonymousValidateResponse,
  AnonymousStatsResponse,
  AnonymousMigrationResponse,
} from '../types';

export const anonymousApi = {
  generateAnonymousId: (deviceId?: string) => {
    const options: RequestInit = { method: 'GET' };
    if (deviceId) {
      options.headers = { 'x-device-id': deviceId };
    }
    return apiService.request<AnonymousGenerateResponse>('/anonymous/generate', options, 0, true);
  },
  validateAnonymousId: (anonymousId: string) =>
    apiService.post<AnonymousValidateResponse>('/anonymous/validate', { anonymousId }, true),
  getAnonymousStats: (anonymousId: string) =>
    apiService.post<AnonymousStatsResponse>('/anonymous/stats', { anonymousId }, true),
  migrateAnonymousData: (anonymousId: string) =>
    apiService.post<AnonymousMigrationResponse>('/anonymous/migrate', { anonymousId }),
};
