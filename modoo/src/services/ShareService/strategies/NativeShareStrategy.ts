import { Share, Platform } from 'react-native';
import { ShareOptions, ShareResult } from '../types';
import { BaseShareStrategy } from './BaseShareStrategy';
import { ShareContentOptimizer } from '../ShareContentOptimizer';

export class NativeShareStrategy extends BaseShareStrategy {
  platform: 'native' = 'native';

  canShare(): boolean {
    return true;
  }

  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      this.validateOptions(options);

      const optimized = ShareContentOptimizer.optimize(options, 'native');

      const shareMessage = ShareContentOptimizer.generateShareMessage(options, 'native');

      const shareOptions =
        Platform.OS === 'ios'
          ? {
              title: optimized.title,
              message: shareMessage,
            }
          : {
              title: optimized.title,
              message: shareMessage,
              url: optimized.url,
            };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        return this.createSuccessResult(result);
      } else if (result.action === Share.dismissedAction) {
        return this.createErrorResult('User cancelled share');
      }

      return this.createSuccessResult(result);
    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Share failed');
    }
  }
}
