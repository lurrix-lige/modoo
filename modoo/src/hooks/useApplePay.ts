import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { applePayService, ApplePayResult, ApplePayErrorCode } from '../services/ApplePayService';

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
        setError('当前设备不支持 Apple Pay');
      }
    };

    checkApplePay();
  }, []);

  const purchaseWithApple = useCallback(async (planId: string, planName?: string): Promise<ApplePayResult> => {
    if (!isApplePayAvailable) {
      const errorMsg = '当前设备不支持 Apple Pay';
      setError(errorMsg);
      return { success: false, error: errorMsg, errorCode: ApplePayErrorCode.NOT_SUPPORTED };
    }

    setIsLoading(true);
    setError(null);

    try {
      const createResult = await applePayService.createOrder(planId);

      if (!createResult.success) {
        setError(createResult.error || '创建订单失败');
        return createResult;
      }

      const orderNo = createResult.orderNo!;
      const orderId = createResult.orderId!;

      const config = await applePayService.getPaymentConfig();
      const amount = config.total?.amount || '0.01';

      const paymentResult = await performApplePay(orderNo, planName || '会员订阅', amount);

      if (!paymentResult.success) {
        setError(paymentResult.error || '支付失败');
        return { success: false, error: paymentResult.error, errorCode: ApplePayErrorCode.VERIFY_FAILED };
      }

      const verifyResult = await applePayService.verifyPayment(
        paymentResult.paymentData!,
        orderNo
      );

      if (!verifyResult.success) {
        setError(verifyResult.error || '支付验证失败');
      }

      return verifyResult;
    } catch (err: any) {
      const errorMessage = err.message || '支付过程中出现错误';
      setError(errorMessage);
      return { success: false, error: errorMessage, errorCode: ApplePayErrorCode.VERIFY_FAILED };
    } finally {
      setIsLoading(false);
    }
  }, [isApplePayAvailable]);

  const performApplePay = async (orderNo: string, itemName: string, amount: string): Promise<{ success: boolean; paymentData?: string; error?: string }> => {
    try {
      if (Platform.OS !== 'ios') {
        return { success: false, error: 'Apple Pay 仅支持 iOS 设备' };
      }

      // @ts-ignore: Dynamic import of Apple Pay module
      const applePayModule = await import('react-native-apple-pay').catch(() => null);
      
      if (!applePayModule || !applePayModule.ApplePay) {
        return { success: false, error: 'Apple Pay 模块未安装', };
      }

      const config = await applePayService.getPaymentConfig();
      const merchantIdentifier = config.merchantIdentifier || 'merchant.com.modoo';

      const paymentRequest = {
        countryCode: config.countryCode || 'CN',
        currencyCode: config.currencyCode || 'CNY',
        merchantIdentifier,
        paymentSummaryItems: [
          {
            label: itemName,
            amount,
            type: 'final',
          },
        ],
        supportedNetworks: config.supportedNetworks || ['amex', 'masterCard', 'visa', 'discover'],
        merchantCapabilities: config.merchantCapabilities || ['supports3DS', 'supportsCredit', 'supportsDebit'],
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
          error: result.error || '支付失败',
        };
      }
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('cancel')) {
        return { success: false, error: '用户取消支付' };
      }
      return { success: false, error: error.message || 'Apple Pay 调用失败' };
    }
  };

  const queryOrder = useCallback(async (orderId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await applePayService.getPaymentConfig();
      return response;
    } catch (err: any) {
      const errorMessage = err.message || '查询订单失败';
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