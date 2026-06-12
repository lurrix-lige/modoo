import { apiService, AnalyticsEventRequest, AnalyticsSessionRequest, AnalyticsProfileRequest, AnalyticsUserProfile, AnalyticsFeatureUsageRequest, AnalyticsFeatureUsage, AnalyticsErrorRequest } from '../ApiService';

export const analyticsApi = {
  reportEvent: (data: AnalyticsEventRequest): Promise<{ eventId: string }> =>
    apiService.reportAnalyticsEvent(data),
  reportBatchEvents: (batchId: string, deviceId: string, events: AnalyticsEventRequest[]): Promise<{ batchId: string; eventsProcessed: number }> =>
    apiService.reportAnalyticsBatchEvents(batchId, deviceId, events),
  reportSession: (data: AnalyticsSessionRequest): Promise<{ sessionId: string }> =>
    apiService.reportAnalyticsSession(data),
  reportProfile: (data: AnalyticsProfileRequest): Promise<AnalyticsUserProfile> =>
    apiService.reportAnalyticsProfile(data),
  reportFeatureUsage: (data: AnalyticsFeatureUsageRequest): Promise<AnalyticsFeatureUsage> =>
    apiService.reportAnalyticsFeatureUsage(data),
  reportError: (data: AnalyticsErrorRequest): Promise<{ errorId: string }> =>
    apiService.reportAnalyticsError(data),
};
