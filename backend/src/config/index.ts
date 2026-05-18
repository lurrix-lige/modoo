import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dozoo-super-secret-key-change-in-production',
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '7d',
    refreshTokenExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '14'),
  },

  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
    log: (process.env.NODE_ENV === 'development') ? ['query', 'error', 'warn'] : ['error'],
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
    env: process.env.WECHAT_ENV || 'sandbox',
    isSandbox: process.env.WECHAT_ENV === 'sandbox',
    payApi: process.env.WECHAT_PAY_API || 'https://api.mch.weixin.qq.com',
    sandboxApi: process.env.WECHAT_PAY_SANDBOX_API || 'https://api.mch.weixin.qq.com/sandboxnew',
  },

  apple: {
    appId: process.env.APPLE_APP_ID || '',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientId: process.env.APPLE_CLIENT_ID || '',
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

export type Config = typeof config;