export type EventType = 'page_view' | 'click' | 'form_submit' | 'content_interaction' | 
                         'feature_used' | 'error' | 'performance' | 'session_start' | 'session_end';

export interface AnalyticsEvent {
  eventName: string;
  eventType: EventType;
  userId?: string;
  deviceId: string;
  sessionId?: string;
  
  screenName?: string;
  screenPath?: string;
  screenParams?: Record<string, any>;
  elementId?: string;
  elementType?: string;
  
  eventData?: Record<string, any>;
  
  platform?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  timezone?: string;
  locale?: string;
  
  occurredAt: string;
  durationMs?: number;
  success?: boolean;
  errorType?: string;
  isAnonymous?: boolean;
}

export interface AnalyticsSession {
  id: string;
  userId?: string;
  deviceId: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  screensVisited?: string[];
}

export interface AnalyticsConfig {
  enabled: boolean;
  sessionTimeoutMs: number;
  batchSize: number;
  flushIntervalMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  enableCompression: boolean;
  privacy: {
    collectPII: boolean;
    collectDeviceInfo: boolean;
    collectLocation: boolean;
    sendAnonymousId: boolean;
  };
}

export const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  sessionTimeoutMs: 30 * 60 * 1000, // 30分钟
  batchSize: 20,
  flushIntervalMs: 30 * 1000, // 30秒
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  enableCompression: true,
  privacy: {
    collectPII: true,
    collectDeviceInfo: true,
    collectLocation: false,
    sendAnonymousId: true,
  },
};