import { ShareOptions, ShareResult } from '../types';
import { BaseShareStrategy } from './BaseShareStrategy';
import { ShareContentOptimizer } from '../ShareContentOptimizer';

export class WeiboShareStrategy extends BaseShareStrategy {
  platform: 'weibo' = 'weibo';

  private getWeiboSDK(): any | null {
    try {
      return require('react-native-weibo');
    } catch {
      return null;
    }
  }

  canShare(): boolean {
    const WeiboSDK = this.getWeiboSDK();
    if (!WeiboSDK || typeof WeiboSDK.isWeiboInstalled !== 'function') {
      return false;
    }

    try {
      return WeiboSDK.isWeiboInstalled();
    } catch {
      return false;
    }
  }

  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      this.validateOptions(options);

      const WeiboSDK = this.getWeiboSDK();

      if (!WeiboSDK) {
        return this.createErrorResult('微博分享SDK未安装');
      }

      try {
        const isInstalled = WeiboSDK.isWeiboInstalled();
        if (!isInstalled) {
          return this.createErrorResult('未安装微博客户端');
        }
      } catch (error) {
        return this.createErrorResult('无法检测微博安装状态');
      }

      const optimized = ShareContentOptimizer.optimize(options, 'weibo');

      const text = [optimized.title, optimized.description].filter(Boolean).join(' ');

      const result = await WeiboSDK.share({
        type: optimized.imageUrl ? 'image' : 'text',
        text: text,
        imageUrl: optimized.imageUrl,
      });

      return this.createSuccessResult(result);
    } catch (error: any) {
      let errorMessage = '微博分享失败';

      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = '用户取消分享';
      } else if (error.code === 'E_NO_WEIBO') {
        errorMessage = '未安装微博客户端';
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      return this.createErrorResult(errorMessage);
    }
  }
}
