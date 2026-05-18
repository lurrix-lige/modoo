/**
 * 环境变量配置管理
 * 
 * 命名规范：
 * - 前端暴露变量必须以 EXPO_PUBLIC_ 前缀开头
 * - 第三方服务变量使用服务商名称作为前缀（WECHAT_, APPLE_）
 * - 变量名使用大写蛇形命名法（UPPER_SNAKE_CASE）
 * 
 * 使用方式：
 * import { CONFIG } from './config/env';
 * const baseUrl = CONFIG.api.BASE_URL;
 */

// ============================================
// 类型定义
// ============================================

export interface AppConfig {
  VERSION: string;
  BUILD_NUMBER: string;
  ENV: 'development' | 'staging' | 'production';
  SUPPORT_EMAIL: string;
  WEBSITE_URL: string;
  APP_STORE_URL: string;
}

export interface ApiConfig {
  BASE_URL: string;
  VERSION: string;
  TIMEOUT: number;
  RETRIES: number;
  RETRY_DELAY: number;
  MAX_REFRESH_RETRIES: number;
}

export interface CdnConfig {
  URL: string;
}

export interface AuthConfig {
  TOKEN_EXPIRY_BUFFER: number;
  SESSION_TIMEOUT: number;
  CHECK_INTERVAL: number;
  ACTIVITY_THROTTLE_MS: number;
}

export interface StorageKeys {
  ACCESS_TOKEN: string;
  REFRESH_TOKEN: string;
  TOKEN_EXPIRES_AT: string;
  LAST_ACTIVITY_AT: string;
  IS_PAID: string;
  LANGUAGE_PREFERENCE: string;
  VISIT_RECORD: string;
  HEALTH_CHECK: string;
}

export interface I18nConfig {
  DEFAULT_LANGUAGE: string;
  SUPPORTED_LANGUAGES: readonly ['zh-CN', 'en'];
}

export interface WechatConfig {
  APP_ID: string;
}

export interface AppleConfig {
  TEAM_ID: string;
  APP_ID: string;
  CLIENT_ID: string;
}

export interface ExpoConfig {
  PROJECT_ID: string;
}

export interface Config {
  app: AppConfig;
  api: ApiConfig;
  cdn: CdnConfig;
  auth: AuthConfig;
  storage: StorageKeys;
  i18n: I18nConfig;
  wechat: WechatConfig;
  apple: AppleConfig;
  expo: ExpoConfig;
}

// ============================================
// App Configuration
// ============================================
export const APP_CONFIG: AppConfig = {
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  BUILD_NUMBER: process.env.EXPO_PUBLIC_BUILD_NUMBER || '2026.05.01',
  ENV: (process.env.EXPO_PUBLIC_ENV as AppConfig['ENV']) || 'development',
  SUPPORT_EMAIL: 'support@modoo.baby',
  WEBSITE_URL: 'https://www.modoo.baby',
  APP_STORE_URL: 'https://apps.apple.com/app/modoo.baby',
};

// ============================================
// API Configuration
// ============================================
export const API_CONFIG: ApiConfig = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.124.13:3000',
  VERSION: '/api/v1',
  TIMEOUT: APP_CONFIG.ENV === 'development' ? 30000 : parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000', 10),
  RETRIES: APP_CONFIG.ENV === 'development' ? 0 : parseInt(process.env.EXPO_PUBLIC_API_RETRIES || '3', 10),
  RETRY_DELAY: parseInt(process.env.EXPO_PUBLIC_API_RETRY_DELAY || '1000', 10),
  MAX_REFRESH_RETRIES: parseInt(process.env.EXPO_PUBLIC_API_MAX_REFRESH_RETRIES || '1', 10),
};

// ============================================
// CDN Configuration
// ============================================
export const CDN_CONFIG: CdnConfig = {
  URL: process.env.EXPO_PUBLIC_CDN_URL || 'https://cdn.modoo.baby',
};

// ============================================
// Auth Configuration
// ============================================
export const AUTH_CONFIG: AuthConfig = {
  TOKEN_EXPIRY_BUFFER: parseInt(process.env.EXPO_PUBLIC_AUTH_TOKEN_EXPIRY_BUFFER || '1800000', 10),
  SESSION_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_AUTH_SESSION_TIMEOUT || '604800000', 10),
  CHECK_INTERVAL: parseInt(process.env.EXPO_PUBLIC_AUTH_CHECK_INTERVAL || '300000', 10),
  ACTIVITY_THROTTLE_MS: parseInt(process.env.EXPO_PUBLIC_AUTH_ACTIVITY_THROTTLE || '60000', 10),
};

// ============================================
// Storage Keys
// ============================================
export const STORAGE_KEYS: StorageKeys = {
  ACCESS_TOKEN: '@modoo_access_token',
  REFRESH_TOKEN: '@modoo_refresh_token',
  TOKEN_EXPIRES_AT: '@modoo_token_expires_at',
  LAST_ACTIVITY_AT: '@modoo_last_activity_at',
  IS_PAID: '@modoo_is_paid',
  LANGUAGE_PREFERENCE: '@modoo_language_preference',
  VISIT_RECORD: 'modoo_visit_record',
  HEALTH_CHECK: '@modoo_health_check',
};

// ============================================
// I18n Configuration
// ============================================
export const I18N_CONFIG: I18nConfig = {
  DEFAULT_LANGUAGE: process.env.EXPO_PUBLIC_I18N_DEFAULT_LANG || 'zh-CN',
  SUPPORTED_LANGUAGES: ['zh-CN', 'en'] as const,
};

// ============================================
// Wechat Configuration
// ============================================
export const WECHAT_CONFIG: WechatConfig = {
  APP_ID: process.env.WECHAT_APP_ID || '',
};

// ============================================
// Apple Configuration
// ============================================
export const APPLE_CONFIG: AppleConfig = {
  TEAM_ID: process.env.APPLE_TEAM_ID || '',
  APP_ID: process.env.APPLE_APP_ID || '',
  CLIENT_ID: process.env.APPLE_CLIENT_ID || '',
};

// ============================================
// Expo Configuration
// ============================================
export const EXPO_CONFIG: ExpoConfig = {
  PROJECT_ID: process.env.EXPO_PROJECT_ID || '6335c453-5681-44e5-a1ae-859938c80375',
};

// ============================================
// Unified Config Export
// ============================================
export const CONFIG: Config = {
  app: APP_CONFIG,
  api: API_CONFIG,
  cdn: CDN_CONFIG,
  auth: AUTH_CONFIG,
  storage: STORAGE_KEYS,
  i18n: I18N_CONFIG,
  wechat: WECHAT_CONFIG,
  apple: APPLE_CONFIG,
  expo: EXPO_CONFIG,
} as const;

// ============================================
// 配置校验
// ============================================
export function validateConfig(): void {
  const missingConfigs: string[] = [];
  
  if (!CONFIG.wechat.APP_ID) {
    missingConfigs.push('WECHAT_APP_ID');
  }
  
  if (missingConfigs.length > 0) {
    console.warn(`[CONFIG WARNING] Missing environment variables: ${missingConfigs.join(', ')}`);
  }
}
