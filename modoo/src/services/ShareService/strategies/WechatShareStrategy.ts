import { ShareOptions, ShareResult } from '../types';
import { BaseShareStrategy } from './BaseShareStrategy';
import { ShareContentOptimizer } from '../ShareContentOptimizer';

export class WechatShareStrategy extends BaseShareStrategy {
  platform: 'wechat' = 'wechat';

  private getWeChat(): any | null {
    try {
      return require('react-native-wechat');
    } catch {
      return null;
    }
  }

  canShare(): boolean {
    const WeChat = this.getWeChat();
    if (!WeChat || typeof WeChat.isWXAppInstalled !== 'function') {
      return false;
    }

    try {
      return WeChat.isWXAppInstalled();
    } catch {
      return false;
    }
  }

  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      this.validateOptions(options);

      const WeChat = this.getWeChat();

      if (!WeChat) {
        return this.createErrorResult('微信分享SDK未安装');
      }

      try {
        const isInstalled = WeChat.isWXAppInstalled();
        if (!isInstalled) {
          return this.createErrorResult('未安装微信客户端');
        }
      } catch (error) {
        return this.createErrorResult('无法检测微信安装状态');
      }

      const optimized = ShareContentOptimizer.optimize(options, 'wechat');

      let result;

      if (optimized.url) {
        result = await WeChat.shareToSession({
          title: optimized.title,
          description: optimized.description,
          thumbImage: optimized.imageUrl,
          type: 'news',
          webpageUrl: optimized.url,
        });
      } else {
        result = await WeChat.shareToSession({
          title: optimized.title,
          description: optimized.description,
          type: 'text',
        });
      }

      return this.createSuccessResult(result);
    } catch (error: any) {
      const errorCode = error.code || error.errCode;
      let errorMessage = '微信分享失败';

      if (errorCode === -6) {
        errorMessage = '用户取消分享';
      } else if (errorCode === -5) {
        errorMessage = '微信版本不支持';
      } else if (errorCode === -4) {
        errorMessage = '微信尚未安装';
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      return this.createErrorResult(errorMessage);
    }
  }
}
