import { useState, useCallback } from 'react';
import { ShareOptions, ShareResult, SharePlatform } from '../types';
import { share } from '../share';

export interface UseShareReturn {
  isLoading: boolean;
  error: string | null;
  result: ShareResult | null;
  shareTo: (platform: SharePlatform, options: ShareOptions) => Promise<ShareResult>;
  shareNative: (options: ShareOptions) => Promise<ShareResult>;
  shareWechat: (options: ShareOptions) => Promise<ShareResult>;
  shareQQ: (options: ShareOptions) => Promise<ShareResult>;
  shareWeibo: (options: ShareOptions) => Promise<ShareResult>;
  shareAuto: (options: ShareOptions, preferredPlatforms?: SharePlatform[]) => Promise<ShareResult>;
  reset: () => void;
}

export const useShare = (): UseShareReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShareResult | null>(null);

  const executeShare = useCallback(async (
    action: () => Promise<ShareResult>
  ) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const shareResult = await action();
      setResult(shareResult);
      
      if (!shareResult.success) {
        setError(shareResult.message || 'Share failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Share failed';
      setError(errorMessage);
      setResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const shareTo = useCallback(async (platform: SharePlatform, options: ShareOptions): Promise<ShareResult> => {
    await executeShare(() => share.to(platform, options));
    return result || { success: false, message: 'Share failed' };
  }, [executeShare, result]);

  const shareNative = useCallback(async (options: ShareOptions): Promise<ShareResult> => {
    await executeShare(() => share.native(options));
    return result || { success: false, message: 'Share failed' };
  }, [executeShare, result]);

  const shareWechat = useCallback(async (options: ShareOptions): Promise<ShareResult> => {
    await executeShare(() => share.wechat(options));
    return result || { success: false, message: 'Share failed' };
  }, [executeShare, result]);

  const shareQQ = useCallback(async (options: ShareOptions): Promise<ShareResult> => {
    await executeShare(() => share.qq(options));
    return result || { success: false, message: 'Share failed' };
  }, [executeShare, result]);

  const shareWeibo = useCallback(async (options: ShareOptions): Promise<ShareResult> => {
    await executeShare(() => share.weibo(options));
    return result || { success: false, message: 'Share failed' };
  }, [executeShare, result]);

  const shareAuto = useCallback(async (options: ShareOptions, preferredPlatforms?: SharePlatform[]): Promise<ShareResult> => {
    await executeShare(() => share.auto(options, preferredPlatforms));
    return result || { success: false, message: 'Share failed' };
  }, [executeShare, result]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    isLoading,
    error,
    result,
    shareTo,
    shareNative,
    shareWechat,
    shareQQ,
    shareWeibo,
    shareAuto,
    reset,
  };
};