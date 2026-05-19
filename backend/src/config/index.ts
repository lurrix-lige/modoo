/**
 * 后端环境变量配置管理
 * 
 * 命名规范：
 * - 后端变量无需 EXPO_PUBLIC_ 前缀
 * - 第三方服务变量使用服务商名称作为前缀（WECHAT_, APPLE_）
 * - 变量名使用大写蛇形命名法（UPPER_SNAKE_CASE）
 * 
 * 使用方式：
 * import { config } from './config';
 * const port = config.server.port;
 */

import * as dotenv from 'dotenv';

dotenv.config();

// ============================================
// 类型定义
// ============================================

export interface ServerConfig {
  host: string;
  port: number;
  env: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  corsOrigins: string[];
}

export interface JwtConfig {
  secret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresDays: number;
}

export interface DatabaseConfig {
  url: string;
  log: string[];
}

export interface VerificationConfig {
  expiryMinutes: number;
  maxAttempts: number;
  maxVerifyAttempts: number;
  enableRealSms: boolean;
  rateLimitWindowMs: number;
}

export interface AccountValidationConfig {
  enabled: boolean;
  phonePattern: string;
  minPhoneLength: number;
  maxPhoneLength: number;
  blockedPrefixes: string[];
  blockedPhones: string[];
}

export interface SentryConfig {
  dsn: string;
  environment: string;
}

export interface LoggerConfig {
  level: string;
}

export interface WechatConfig {
  appId: string;
  appSecret: string;
  mchId: string;
  apiKey: string;
  env: 'sandbox' | 'production';
  isSandbox: boolean;
  payApi: string;
  sandboxApi: string;
  oauthApi: string;
  userInfoApi: string;
}

export interface AppleConfig {
  appId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
  clientId: string;
  authKeysUrl: string;
  issuer: string;
}

export interface ApplePayConfig {
  merchantId: string;
  displayName: string;
  countryCode: string;
  currencyCode: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
}

export interface Config {
  server: ServerConfig;
  jwt: JwtConfig;
  database: DatabaseConfig;
  verification: VerificationConfig;
  accountValidation: AccountValidationConfig;
  sentry: SentryConfig;
  logger: LoggerConfig;
  wechat: WechatConfig;
  apple: AppleConfig;
  applePay: ApplePayConfig;
}

// ============================================
// 配置定义
// ============================================

export const config: Config = {
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000', 10),
    env: (process.env.NODE_ENV as ServerConfig['env']) || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '14'),
  },

  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  },

  verification: {
    expiryMinutes: parseInt(process.env.VERIFICATION_EXPIRY_MINUTES || '5'),
    maxAttempts: parseInt(process.env.MAX_VERIFICATION_ATTEMPTS || '5'),
    maxVerifyAttempts: parseInt(process.env.MAX_VERIFY_ATTEMPTS || '3'),
    enableRealSms: process.env.ENABLE_REAL_SMS === 'true',
    rateLimitWindowMs: parseInt(process.env.VERIFICATION_RATE_LIMIT_WINDOW_MS || '60000'),
  },

  accountValidation: {
    enabled: process.env.ACCOUNT_VALIDATION_ENABLED !== 'false',
    phonePattern: process.env.PHONE_VALIDATION_PATTERN || '^1[3-9]\\d{9}$',
    minPhoneLength: parseInt(process.env.MIN_PHONE_LENGTH || '11'),
    maxPhoneLength: parseInt(process.env.MAX_PHONE_LENGTH || '11'),
    blockedPrefixes: (process.env.BLOCKED_PHONE_PREFIXES || '').split(',').filter(Boolean),
    blockedPhones: (process.env.BLOCKED_PHONES || '').split(',').filter(Boolean),
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
  },

  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },

  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    apiKey: process.env.WECHAT_API_KEY || '',
    env: (process.env.WECHAT_ENV as WechatConfig['env']) || 'sandbox',
    isSandbox: process.env.WECHAT_ENV === 'sandbox',
    payApi: process.env.WECHAT_PAY_API || 'https://api.mch.weixin.qq.com',
    sandboxApi: process.env.WECHAT_PAY_SANDBOX_API || 'https://api.mch.weixin.qq.com/sandboxnew',
    oauthApi: process.env.WECHAT_OAUTH_API || 'https://api.weixin.qq.com/sns/oauth2/access_token',
    userInfoApi: process.env.WECHAT_USERINFO_API || 'https://api.weixin.qq.com/sns/userinfo',
  },

  apple: {
    appId: process.env.APPLE_APP_ID || '',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientId: process.env.APPLE_CLIENT_ID || '',
    authKeysUrl: process.env.APPLE_AUTH_KEYS_URL || 'https://appleid.apple.com/auth/keys',
    issuer: process.env.APPLE_ISSUER || 'https://appleid.apple.com',
  },

  applePay: {
    merchantId: process.env.APPLE_PAY_MERCHANT_ID || 'merchant.com.modoo',
    displayName: process.env.APPLE_PAY_DISPLAY_NAME || 'Modoo',
    countryCode: process.env.APPLE_PAY_COUNTRY_CODE || 'CN',
    currencyCode: process.env.APPLE_PAY_CURRENCY_CODE || 'CNY',
    supportedNetworks: ['amex', 'masterCard', 'visa', 'discover', 'jcb'],
    merchantCapabilities: ['supports3DS', 'supportsCredit', 'supportsDebit'],
  },
};

// ============================================
// 配置校验
// ============================================
export function validateConfig(): void {
  const missingConfigs: string[] = [];

  if (!config.jwt.secret) {
    console.error('[CONFIG FATAL] JWT_SECRET is required. Set it in your .env file.');
    process.exit(1);
  }

  if (!config.wechat.appId) {
    missingConfigs.push('WECHAT_APP_ID');
  }

  if (!config.wechat.mchId && config.wechat.env === 'production') {
    missingConfigs.push('WECHAT_MCH_ID (生产环境必需)');
  }

  if (!config.wechat.apiKey && config.wechat.env === 'production') {
    missingConfigs.push('WECHAT_API_KEY (生产环境必需)');
  }

  if (missingConfigs.length > 0) {
    console.warn(`[CONFIG WARNING] Missing or invalid environment variables:\n  - ${missingConfigs.join('\n  - ')}`);
  }
}
