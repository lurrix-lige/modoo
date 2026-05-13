import { SharePlatform, ShareOptions, ShareResult } from './types';
import { ShareFactory } from './ShareFactory';

const factory = ShareFactory.getInstance();

export const share = {
  /**
   * 使用指定平台分享内容
   * @param platform 分享平台
   * @param options 分享选项
   * @returns 分享结果
   */
  async to(
    platform: SharePlatform,
    options: ShareOptions
  ): Promise<ShareResult> {
    return factory.share(platform, options);
  },

  /**
   * 使用原生分享
   * @param options 分享选项
   * @returns 分享结果
   */
  async native(options: ShareOptions): Promise<ShareResult> {
    return factory.share('native', options);
  },

  /**
   * 使用微信分享
   * @param options 分享选项
   * @returns 分享结果
   */
  async wechat(options: ShareOptions): Promise<ShareResult> {
    return factory.share('wechat', options);
  },

  /**
   * 使用QQ分享
   * @param options 分享选项
   * @returns 分享结果
   */
  async qq(options: ShareOptions): Promise<ShareResult> {
    return factory.share('qq', options);
  },

  /**
   * 使用微博分享
   * @param options 分享选项
   * @returns 分享结果
   */
  async weibo(options: ShareOptions): Promise<ShareResult> {
    return factory.share('weibo', options);
  },

  /**
   * 自动选择可用平台分享
   * @param options 分享选项
   * @param preferredPlatforms 优先尝试的平台列表
   * @returns 分享结果
   */
  async auto(
    options: ShareOptions,
    preferredPlatforms?: SharePlatform[]
  ): Promise<ShareResult> {
    const platforms = preferredPlatforms || ['wechat', 'qq', 'weibo', 'native'];
    return factory.shareWithBestAvailable(platforms, options);
  },

  /**
   * 获取所有可用的分享平台
   * @returns 可用平台列表
   */
  getAvailablePlatforms(): SharePlatform[] {
    return factory.getAvailablePlatforms();
  },

  /**
   * 检查指定平台是否可用
   * @param platform 分享平台
   * @returns 是否可用
   */
  isPlatformAvailable(platform: SharePlatform): boolean {
    return factory.isPlatformAvailable(platform);
  },

  /**
   * 注册自定义分享策略
   * @param strategy 分享策略
   */
  registerStrategy(strategy: { platform: SharePlatform; canShare: () => boolean; share: (options: ShareOptions) => Promise<ShareResult> }): void {
    factory.registerStrategy(strategy as any);
  },

  /**
   * 设置默认分享平台
   * @param platform 分享平台
   */
  setDefaultPlatform(platform: SharePlatform): void {
    factory.setDefaultPlatform(platform);
  },

  /**
   * 设置降级分享平台
   * @param platform 分享平台
   */
  setFallbackPlatform(platform: SharePlatform): void {
    factory.setFallbackPlatform(platform);
  },
};

export default share;