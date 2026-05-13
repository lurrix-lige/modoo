export const APP_CONFIG = {
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  BUILD_NUMBER: process.env.EXPO_PUBLIC_BUILD_NUMBER || '2026.05.01',
  ENV: process.env.EXPO_PUBLIC_ENV || 'development',
};

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.124.13:3000',
  VERSION: '/api/v1',
  // 开发环境增加超时时间，避免增量编译时超时
  TIMEOUT: APP_CONFIG.ENV === 'development' ? 30000 : parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10),
  // 开发环境禁用重试，避免重复请求加剧问题
  RETRIES: APP_CONFIG.ENV === 'development' ? 0 : parseInt(process.env.EXPO_PUBLIC_API_RETRIES || '3', 10),
  RETRY_DELAY: parseInt(process.env.EXPO_PUBLIC_API_RETRY_DELAY || '1000', 10),
  MAX_REFRESH_RETRIES: parseInt(process.env.EXPO_PUBLIC_API_MAX_REFRESH_RETRIES || '1', 10),
};

export const CDN_CONFIG = {
  URL: process.env.EXPO_PUBLIC_CDN_URL || 'https://cdn.dozoo.com',
};

export const AUTH_CONFIG = {
  TOKEN_EXPIRY_BUFFER: parseInt(process.env.EXPO_PUBLIC_AUTH_TOKEN_EXPIRY_BUFFER || '1800000', 10),
  SESSION_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_AUTH_SESSION_TIMEOUT || '604800000', 10),
  CHECK_INTERVAL: parseInt(process.env.EXPO_PUBLIC_AUTH_CHECK_INTERVAL || '300000', 10),
  ACTIVITY_THROTTLE_MS: parseInt(process.env.EXPO_PUBLIC_AUTH_ACTIVITY_THROTTLE || '60000', 10),
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@dozoo_access_token',
  REFRESH_TOKEN: '@dozoo_refresh_token',
  TOKEN_EXPIRES_AT: '@dozoo_token_expires_at',
  LAST_ACTIVITY_AT: '@dozoo_last_activity_at',
  IS_PAID: '@dozoo_is_paid',
  LANGUAGE_PREFERENCE: '@dozoo_language_preference',
  VISIT_RECORD: 'dozoo_visit_record',
  HEALTH_CHECK: '@dozoo_health_check',
};

export const I18N_CONFIG = {
  DEFAULT_LANGUAGE: process.env.EXPO_PUBLIC_I18N_DEFAULT_LANG || 'zh-CN',
  SUPPORTED_LANGUAGES: ['zh-CN', 'en'] as const,
};
