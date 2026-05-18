import { apiService } from '../infrastructure/api';

export enum ApplePayErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  ORDER_CREATE_FAILED = 'ORDER_CREATE_FAILED',
  VERIFY_FAILED = 'VERIFY_FAILED',
  MODULE_NOT_AVAILABLE = 'MODULE_NOT_AVAILABLE',
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
}

export interface ApplePayResult {
  success: boolean;
  orderId?: string;
  orderNo?: string;
  transactionId?: string;
  error?: string;
  errorCode?: ApplePayErrorCode;
}

export interface ApplePayOrderInfo {
  orderId: string;
  orderNo: string;
  countryCode: string;
  currencyCode: string;
  merchantIdentifier: string;
  merchantCapabilities: string[];
  supportedNetworks: string[];
  total: {
    label: string;
    amount: string;
    type: string;
  };
  lineItems: Array<{
    label: string;
    amount: string;
  }>;
  metadata: {
    orderId: string;
  };
}

export class ApplePayService {
  private static instance: ApplePayService;

  private constructor() {}

  public static getInstance(): ApplePayService {
    if (!ApplePayService.instance) {
      ApplePayService.instance = new ApplePayService();
    }
    return ApplePayService.instance;
  }

  public async isSupported(): Promise<boolean> {
    try {
      const { Platform } = await import('react-native');
      const isSupported = Platform.OS === 'ios' && parseFloat(Platform.Version) >= 10;
      
      if (!isSupported && Platform.OS !== 'ios') {
        console.warn('Apple Pay is only available on iOS');
      }
      
      return isSupported;
    } catch {
      return false;
    }
  }

  public async createOrder(planId: string): Promise<ApplePayResult> {
    try {
      const response: any = await apiService.post('/payment/apple/create-order', { planId });
      
      if (response && response.data) {
        return {
          success: true,
          orderId: response.data.orderId,
          orderNo: response.data.orderNo,
        };
      }

      return {
        success: false,
        error: '创建订单失败',
        errorCode: ApplePayErrorCode.ORDER_CREATE_FAILED,
      };
    } catch (error: any) {
      const errorCode = this.mapErrorCode(error.code);
      return {
        success: false,
        error: error.message || '创建订单失败',
        errorCode,
      };
    }
  }

  public async verifyPayment(paymentData: string, orderNo: string): Promise<ApplePayResult> {
    try {
      const response: any = await apiService.post('/payment/apple/verify-payment', {
        paymentData,
        orderNo,
      });

      if (response && response.data) {
        return {
          success: true,
          orderId: response.data.orderId,
          transactionId: response.data.transactionId,
        };
      }

      return {
        success: false,
        error: '支付验证失败',
        errorCode: ApplePayErrorCode.VERIFY_FAILED,
      };
    } catch (error: any) {
      const errorCode = this.mapErrorCode(error.code);
      return {
        success: false,
        error: error.message || '支付验证失败',
        errorCode,
      };
    }
  }

  public async getPaymentConfig(): Promise<any> {
    try {
      const response: any = await apiService.get('/payment/config');
      return response?.data?.apple || {};
    } catch {
      return {};
    }
  }

  private mapErrorCode(code: string | undefined): ApplePayErrorCode {
    if (!code) return ApplePayErrorCode.ORDER_CREATE_FAILED;
    
    if (code === 'ORDER_NOT_FOUND') {
      return ApplePayErrorCode.ORDER_NOT_FOUND;
    }
    
    if (code === 'AMOUNT_MISMATCH') {
      return ApplePayErrorCode.AMOUNT_MISMATCH;
    }
    
    return ApplePayErrorCode.VERIFY_FAILED;
  }
}

export const applePayService = ApplePayService.getInstance();