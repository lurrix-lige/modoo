import {
  SharePlatform,
  ShareOptions,
  ShareResult,
  ShareStrategy,
  ShareFactoryConfig,
} from './types';
import {
  NativeShareStrategy,
  WechatShareStrategy,
  QQShareStrategy,
  WeiboShareStrategy,
} from './strategies';

export class ShareFactory {
  private static instance: ShareFactory;
  private strategies: Map<SharePlatform, ShareStrategy>;
  private defaultPlatform: SharePlatform;
  private fallbackPlatform: SharePlatform;

  private constructor(config?: ShareFactoryConfig) {
    this.strategies = new Map();
    this.defaultPlatform = config?.defaultPlatform || 'native';
    this.fallbackPlatform = config?.fallbackPlatform || 'native';

    this.registerDefaultStrategies();
  }

  public static getInstance(config?: ShareFactoryConfig): ShareFactory {
    if (!ShareFactory.instance) {
      ShareFactory.instance = new ShareFactory(config);
    }
    return ShareFactory.instance;
  }

  private registerDefaultStrategies(): void {
    this.registerStrategy(new NativeShareStrategy());
    this.registerStrategy(new WechatShareStrategy());
    this.registerStrategy(new QQShareStrategy());
    this.registerStrategy(new WeiboShareStrategy());
  }

  public registerStrategy(strategy: ShareStrategy): void {
    this.strategies.set(strategy.platform, strategy);
  }

  public getStrategy(platform: SharePlatform): ShareStrategy | undefined {
    return this.strategies.get(platform);
  }

  public isPlatformAvailable(platform: SharePlatform): boolean {
    const strategy = this.getStrategy(platform);
    return strategy !== undefined && strategy.canShare();
  }

  public getAvailablePlatforms(): SharePlatform[] {
    const available: SharePlatform[] = [];
    this.strategies.forEach((strategy, platform) => {
      if (strategy.canShare()) {
        available.push(platform);
      }
    });
    return available;
  }

  public async share(platform: SharePlatform, options: ShareOptions): Promise<ShareResult> {
    const strategy = this.getStrategy(platform);

    if (!strategy) {
      return this.tryFallback(options);
    }

    if (!strategy.canShare()) {
      return this.tryFallback(options);
    }

    try {
      return await strategy.share(options);
    } catch (error) {
      return this.tryFallback(options);
    }
  }

  public async shareWithBestAvailable(
    platforms: SharePlatform[],
    options: ShareOptions,
  ): Promise<ShareResult> {
    for (const platform of platforms) {
      if (this.isPlatformAvailable(platform)) {
        const result = await this.share(platform, options);
        if (result.success) {
          return result;
        }
      }
    }

    return this.tryFallback(options);
  }

  private async tryFallback(options: ShareOptions): Promise<ShareResult> {
    const fallback = this.getStrategy(this.fallbackPlatform);
    if (fallback) {
      try {
        return await fallback.share(options);
      } catch {
        return {
          success: false,
          platform: this.fallbackPlatform,
          message: 'Share failed',
        };
      }
    }

    return {
      success: false,
      message: 'No share strategy available',
    };
  }

  public setDefaultPlatform(platform: SharePlatform): void {
    this.defaultPlatform = platform;
  }

  public setFallbackPlatform(platform: SharePlatform): void {
    this.fallbackPlatform = platform;
  }
}
