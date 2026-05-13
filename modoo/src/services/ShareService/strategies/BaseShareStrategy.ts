import { ShareOptions, ShareResult, ShareStrategy } from '../types';

export abstract class BaseShareStrategy implements ShareStrategy {
  abstract platform: ShareStrategy['platform'];

  canShare(): boolean {
    return true;
  }

  async share(_options: ShareOptions): Promise<ShareResult> {
    return {
      success: false,
      platform: this.platform,
      message: 'Not implemented',
    };
  }

  protected validateOptions(options: ShareOptions): void {
    if (!options.title) {
      throw new Error('Share title is required');
    }
  }

  protected createSuccessResult(data?: unknown): ShareResult {
    return {
      success: true,
      platform: this.platform,
      data,
    };
  }

  protected createErrorResult(message: string): ShareResult {
    return {
      success: false,
      platform: this.platform,
      message,
    };
  }
}