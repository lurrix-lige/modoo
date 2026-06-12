import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import {
  applePayService,
  ApplePayResult,
  ApplePayErrorCode,
  ApplePayOrderInfo,
} from '../services/ApplePayService';
import i18n from '../i18n';

export interface UseApplePayResult {
  purchaseWithApple: (planId: string, planName?: string) => Promise<ApplePayResult>;
  queryOrder: (orderId: string) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isApplePayAvailable: boolean;
}

export function useApplePay(): UseApplePayResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);

  useEffect(() => {
    const checkApplePay = async () => {
      const available = await applePayService.isSupported();
      setIsApplePayAvailable(available);
      if (!available) {
        setError(i18n.t('errors.applePayNotSupported'));
      }
    };

    checkApplePay();
  }, []);

  const purchaseWithApple = useCallback(
    async (planId: string, planName?: string): Promise<ApplePayResult> => {
      if (!isApplePayAvailable) {
        const errorMsg = i18n.t('errors.applePayNotSupported');
        setError(errorMsg);
        return { success: false, error: errorMsg, errorCode: ApplePayErrorCode.NOT_SUPPORTED };
      }

      setIsLoading(true);
      setError(null);

      try {
        const createResult = await applePayService.createOrder(planId);

        if (!createResult.success) {
          setError(createResult.error || i18n.t('errors.orderCreateFailed'));
          return createResult;
        }

        const orderNo = createResult.orderNo;
        const orderId = createResult.orderId;
        const orderInfo = createResult.orderInfo;

        if (!orderInfo || !orderNo || !orderId) {
          setError(i18n.t('errors.orderInfoIncomplete'));
          return {
            success: false,
            error: i18n.t('errors.orderInfoIncomplete'),
            errorCode: ApplePayErrorCode.ORDER_CREATE_FAILED,
          };
        }

        const paymentResult = await performApplePay(orderInfo);

        if (!paymentResult.success) {
          setError(paymentResult.error || i18n.t('errors.applePayFailed'));
          return {
            success: false,
            error: paymentResult.error,
            errorCode: ApplePayErrorCode.VERIFY_FAILED,
          };
        }

        const verifyResult = await applePayService.verifyPayment(
          paymentResult.paymentData!,
          orderNo,
        );

        if (!verifyResult.success) {
          setError(verifyResult.error || i18n.t('errors.paymentVerificationFailed'));
        }

        return verifyResult;
      } catch (err: any) {
        const errorMessage = err.message || i18n.t('errors.paymentError');
        setError(errorMessage);
        return { success: false, error: errorMessage, errorCode: ApplePayErrorCode.VERIFY_FAILED };
      } finally {
        setIsLoading(false);
      }
    },
    [isApplePayAvailable],
  );

  const performApplePay = async (
    orderInfo: ApplePayOrderInfo,
  ): Promise<{ success: boolean; paymentData?: string; error?: string }> => {
    try {
      if (Platform.OS !== 'ios') {
        return { success: false, error: i18n.t('errors.applePayIOSOnly') };
      }

      // @ts-ignore: Dynamic import of Apple Pay module
      const applePayModule = await import('react-native-apple-pay').catch(() => null);

      if (!applePayModule || !applePayModule.ApplePay) {
        return { success: false, error: i18n.t('errors.applePayModuleNotInstalled') };
      }

      const paymentRequest = {
        countryCode: orderInfo.countryCode,
        currencyCode: orderInfo.currencyCode,
        merchantIdentifier: orderInfo.merchantIdentifier,
        paymentSummaryItems: [
          {
            label: orderInfo.total.label,
            amount: orderInfo.total.amount,
            type: orderInfo.total.type,
          },
        ],
        supportedNetworks: orderInfo.supportedNetworks,
        merchantCapabilities: orderInfo.merchantCapabilities,
      };

      // @ts-ignore: Apple Pay module type
      const result = await applePayModule.ApplePay.requestPayment(paymentRequest);

      if (result.status === 'success') {
        return {
          success: true,
          paymentData: JSON.stringify(result),
        };
      } else {
        return {
          success: false,
          error: result.error || i18n.t('errors.applePayFailed'),
        };
      }
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('cancel')) {
        return { success: false, error: i18n.t('errors.applePayCancelled') };
      }
      return { success: false, error: error.message || i18n.t('errors.applePayError') };
    }
  };

  const queryOrder = useCallback(async (orderId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await applePayService.getPaymentConfig();
      return response;
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
    purchaseWithApple,
    queryOrder,
    isLoading,
    error,
    clearError,
    isApplePayAvailable,
  };
}
