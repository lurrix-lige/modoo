import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { wechatPayService, PayResult, RefundResult } from '../services/WechatPayService';
import i18n from '../i18n';

export interface UseWechatPayResult {
  purchaseWithWechat: (planId: string, planName?: string) => Promise<PayResult>;
  applyRefund: (
    orderId: string,
    refundAmount?: number,
    refundReason?: string,
  ) => Promise<RefundResult>;
  queryOrder: (orderId: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isWechatInstalled: boolean;
}

export function useWechatPay(): UseWechatPayResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkWechat = () => {
      return wechatPayService.isInstalled();
    };

    const installed = checkWechat();
    if (!installed) {
      setError(i18n.t('errors.wechatNotInstalled'));
    }
  }, []);

  const purchaseWithWechat = useCallback(
    async (planId: string, planName?: string): Promise<PayResult> => {
      if (!wechatPayService.isInstalled()) {
        const errorMsg = i18n.t('errors.wechatNotInstalled');
        setError(errorMsg);
        return { success: false, error: errorMsg, errorCode: 'NOT_INSTALLED' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await wechatPayService.createAndPay(planId);

        if (!result.success) {
          setError(result.error || i18n.t('errors.wechatPayFailed'));
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || i18n.t('errors.wechatPayError');
        setError(errorMessage);
        return { success: false, error: errorMessage, errorCode: 'UNKNOWN' };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const applyRefund = useCallback(
    async (
      orderId: string,
      refundAmount?: number,
      refundReason?: string,
    ): Promise<RefundResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await wechatPayService.applyRefund(orderId, refundAmount, refundReason);

        if (!result.success) {
          setError(result.error || i18n.t('errors.refundFailed'));
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || i18n.t('errors.refundError');
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const queryOrder = useCallback(async (orderId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const order = await wechatPayService.queryOrder(orderId);
      return order;
    } catch (err: any) {
      const errorMessage = err.message || i18n.t('errors.queryOrderFailed');
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    purchaseWithWechat,
    applyRefund,
    queryOrder,
    isLoading,
    error,
    clearError,
    isWechatInstalled: wechatPayService.isInstalled(),
  };
}
