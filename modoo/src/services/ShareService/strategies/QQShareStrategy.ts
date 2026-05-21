import { ShareOptions, ShareResult } from '../types';
import { BaseShareStrategy } from './BaseShareStrategy';
import { ShareContentOptimizer } from '../ShareContentOptimizer';

export class QQShareStrategy extends BaseShareStrategy {
  platform: 'qq' = 'qq';

  private getQQShare(): any | null {
    try {
      return require('react-native-qq');
    } catch {
      return null;
    }
  }

  canShare(): boolean {
    const QQShare = this.getQQShare();
    if (!QQShare || typeof QQShare.isQQInstalled !== 'function') {
      return false;
    }

    try {
      return QQShare.isQQInstalled();
    } catch {
      return false;
    }
  }

  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      this.validateOptions(options);

      const QQShare = this.getQQShare();

      if (!QQShare) {
        return this.createErrorResult('QQ分享SDK未安装');
      }

      try {
        const isInstalled = QQShare.isQQInstalled();
        if (!isInstalled) {
          return this.createErrorResult('未安装QQ客户端');
        }
      } catch (error) {
        return this.createErrorResult('无法检测QQ安装状态');
      }

      const optimized = ShareContentOptimizer.optimize(options, 'qq');

      const result = await QQShare.shareToQQ({
        title: optimized.title,
        description: optimized.description,
        url: optimized.url || '',
        imageUrl: optimized.imageUrl || '',
      });

      return this.createSuccessResult(result);
    } catch (error: any) {
      let errorMessage = 'QQ分享失败';

      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = '用户取消分享';
      } else if (error.code === 'E_NO_QQ') {
        errorMessage = '未安装QQ客户端';
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      return this.createErrorResult(errorMessage);
    }
  }
}
