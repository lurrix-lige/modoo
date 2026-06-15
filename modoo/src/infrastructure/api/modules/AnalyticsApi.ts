import { apiService } from '../ApiService';
import type {
  AnalyticsEventRequest,
  AnalyticsSessionRequest,
  AnalyticsProfileRequest,
  AnalyticsUserProfile,
  AnalyticsFeatureUsageRequest,
  AnalyticsFeatureUsage,
  AnalyticsErrorRequest,
} from '../types';

export const analyticsApi = {
  reportEvent: (data: AnalyticsEventRequest) =>
    apiService.post<{ eventId: string }>('/analytics/events', data),
  reportBatchEvents: (batchId: string, deviceId: string, events: AnalyticsEventRequest[]) =>
    apiService.post<{ batchId: string; eventsProcessed: number }>('/analytics/events/batch', {
      batchId,
      deviceId,
      events,
    }),
  reportSession: (data: AnalyticsSessionRequest) =>
    apiService.post<{ sessionId: string }>('/analytics/sessions', data),
  reportProfile: (data: AnalyticsProfileRequest) =>
    apiService.post<AnalyticsUserProfile>('/analytics/profile', data),
  reportFeatureUsage: (data: AnalyticsFeatureUsageRequest) =>
    apiService.post<AnalyticsFeatureUsage>('/analytics/feature-usage', data),
  reportError: (data: AnalyticsErrorRequest) =>
    apiService.post<{ errorId: string }>('/analytics/errors', data),
};
