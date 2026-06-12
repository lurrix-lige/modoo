import { apiService, AnonymousGenerateResponse, AnonymousValidateResponse, AnonymousStatsResponse, AnonymousMigrationResponse } from '../ApiService';

export const anonymousApi = {
  generateAnonymousId: (deviceId?: string): Promise<AnonymousGenerateResponse> =>
    apiService.generateAnonymousId(deviceId),
  validateAnonymousId: (anonymousId: string): Promise<AnonymousValidateResponse> =>
    apiService.validateAnonymousId(anonymousId),
  getAnonymousStats: (anonymousId: string): Promise<AnonymousStatsResponse> =>
    apiService.getAnonymousStats(anonymousId),
  migrateAnonymousData: (anonymousId: string): Promise<AnonymousMigrationResponse> =>
    apiService.migrateAnonymousData(anonymousId),
};
