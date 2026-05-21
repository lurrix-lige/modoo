export type SharePlatform = 'native' | 'wechat' | 'qq' | 'weibo';

export interface ShareOptions {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export interface ShareResult {
  success: boolean;
  platform?: SharePlatform;
  message?: string;
  data?: unknown;
}

export interface ShareStrategy {
  platform: SharePlatform;
  canShare(): boolean;
  share(options: ShareOptions): Promise<ShareResult>;
}

export interface ShareFactoryConfig {
  defaultPlatform?: SharePlatform;
  fallbackPlatform?: SharePlatform;
  platforms?: SharePlatform[];
}
