import { getWechatModule, isWechatInstalled } from './WechatCore';
import { apiService } from '../infrastructure/api/ApiService';

export interface WechatPayParams {
  prepayId: string;
  paySign: string;
  nonceStr: string;
  timestamp: string;
  package: string;
  partnerId?: string;
}

export interface CreateOrderResult {
  orderId: string;
  orderNo: string;
  prepayId: string;
  paySign: string;
  nonceStr: string;
  timestamp: string;
  package: string;
}

export interface PayResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  orderId?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  refundAmount?: number;
  error?: string;
}

export class WechatPayError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'WechatPayError';
  }
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface CreateOrderResponse {
  orderId: string;
  orderNo: string;
  prepayId: string;
  paySign: string;
  nonceStr: string;
  timestamp: string;
  package: string;
}

interface RefundResponse {
  refundId: string;
  refundAmount: number;
}

interface PayConfigResponse {
  appId: string;
  mchId: string;
  isSandbox: boolean;
}

class WechatPayService {
  private static instance: WechatPayService;

  private constructor() {}

  static getInstance(): WechatPayService {
    if (!WechatPayService.instance) {
      WechatPayService.instance = new WechatPayService();
    }
    return WechatPayService.instance;
  }

  isInstalled(): boolean {
    return isWechatInstalled();
  }

  async requestPayment(params: WechatPayParams): Promise<PayResult> {
    if (!this.isInstalled()) {
      return {
        success: false,
        error: '微信未安装',
        errorCode: 'NOT_INSTALLED',
      };
    }

    const wechatModule = getWechatModule();
    if (!wechatModule) {
      return {
        success: false,
        error: '微信支付SDK未安装',
        errorCode: 'SDK_NOT_FOUND',
      };
    }

    try {
      const payParams: any = {
        partnerId: params.partnerId || '',
        prepayId: params.prepayId,
        package: params.package,
        nonceStr: params.nonceStr,
        timestamp: parseInt(params.timestamp, 10),
        sign: params.paySign,
      };

      const result = await wechatModule.pay(payParams);

      if (result.errCode === 0) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.errStr || '支付失败',
          errorCode: result.errCode?.toString() || 'UNKNOWN',
        };
      }
    } catch (error: any) {
      if (error.errCode === -2) {
        return {
          success: false,
          error: '用户取消支付',
          errorCode: 'USER_CANCELLED',
        };
      }
      if (error.errCode === -1) {
        return {
          success: false,
          error: '支付参数错误',
          errorCode: 'INVALID_PARAMS',
        };
      }
      if (error.errCode === -4) {
        return {
          success: false,
          error: '签名验证失败',
          errorCode: 'SIGN_FAILED',
        };
      }
      return {
        success: false,
        error: error.errStr || error.message || '支付失败',
        errorCode: error.errCode?.toString() || 'UNKNOWN',
      };
    }
  }

  async createOrder(planId: string): Promise<CreateOrderResult> {
    const response = await apiService.post<ApiResponse<CreateOrderResponse>>(
      '/payment/wechat/create-order',
      { planId },
    );

    if (!response.success || !response.data) {
      throw new WechatPayError(response.message || '创建订单失败', 'CREATE_ORDER_FAILED');
    }

    const data = response.data;
    return {
      orderId: data.orderId,
      orderNo: data.orderNo,
      prepayId: data.prepayId,
      paySign: data.paySign,
      nonceStr: data.nonceStr,
      timestamp: data.timestamp,
      package: data.package,
    };
  }

  async createAndPay(planId: string): Promise<PayResult> {
    try {
      const orderResult = await this.createOrder(planId);

      const payResult = await this.requestPayment({
        prepayId: orderResult.prepayId,
        paySign: orderResult.paySign,
        nonceStr: orderResult.nonceStr,
        timestamp: orderResult.timestamp,
        package: orderResult.package,
      });

      return {
        success: payResult.success,
        error: payResult.error,
        errorCode: payResult.errorCode,
        orderId: orderResult.orderId,
      };
    } catch (error: any) {
      if (error instanceof WechatPayError) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code,
        };
      }
      return {
        success: false,
        error: error.message || '支付失败',
        errorCode: 'UNKNOWN',
      };
    }
  }

  async applyRefund(
    orderId: string,
    refundAmount?: number,
    refundReason?: string,
  ): Promise<RefundResult> {
    try {
      const response = await apiService.post<ApiResponse<RefundResponse>>(
        '/payment/wechat/refund',
        {
          orderId,
          refundAmount,
          refundReason,
        },
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.message || '退款申请失败',
        };
      }

      const data = response.data;
      return {
        success: true,
        refundId: data.refundId,
        refundAmount: data.refundAmount,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '退款申请失败',
      };
    }
  }

  async queryOrder(orderId: string): Promise<any> {
    const response = await apiService.get<ApiResponse<any>>(`/payment/order/${orderId}`);

    if (!response.success) {
      throw new WechatPayError(response.message || '查询订单失败', 'QUERY_ORDER_FAILED');
    }

    return response.data;
  }

  async getPayConfig(): Promise<{
    appId: string;
    mchId: string;
    isSandbox: boolean;
  }> {
    const response = await apiService.get<ApiResponse<PayConfigResponse>>('/payment/wechat/config');

    if (!response.success || !response.data) {
      throw new WechatPayError('获取支付配置失败', 'GET_CONFIG_FAILED');
    }

    return response.data;
  }
}

export const wechatPayService = WechatPayService.getInstance();
