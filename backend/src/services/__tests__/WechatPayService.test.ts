import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');
vi.mock('../../config', () => ({
  config: {
    wechat: {
      appId: 'wx-test-app',
      mchId: '1234567890',
      apiKey: 'test-api-key',
      isSandbox: false,
      payApi: 'https://api.mch.weixin.qq.com',
      sandboxApi: 'https://api.mch.weixin.qq.com/sandboxnew',
      oauthApi: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      userInfoApi: 'https://api.weixin.qq.com/sns/userinfo',
    },
  },
}));

vi.mock('../../utils/errors', () => {
  const actual = vi.importActual('../../utils/errors');
  return actual;
});

import axios from 'axios';
import {
  createWechatPayUnifiedOrder,
  applyWechatPayRefund,
  verifyWechatPaySignature,
  getWechatPayConfig,
} from '../WechatPayService';

const mockAxios = vi.mocked(axios);

const successXml = `<xml><return_code><![CDATA[SUCCESS]]></return_code><result_code><![CDATA[SUCCESS]]></result_code><prepay_id><![CDATA[wx1234567890]]></prepay_id></xml>`;

describe('WechatPayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWechatPayConfig', () => {
    it('should return WeChat Pay configuration', () => {
      const cfg = getWechatPayConfig();

      expect(cfg).toHaveProperty('appId');
      expect(cfg).toHaveProperty('mchId');
      expect(cfg).toHaveProperty('isSandbox');
      expect(typeof cfg.isSandbox).toBe('boolean');
    });
  });

  describe('verifyWechatPaySignature', () => {
    it('should verify a valid signature', async () => {
      const apiKey = 'test-key';
      const params: Record<string, string> = {
        appid: 'wx123',
        mch_id: '123',
        nonce_str: 'abc',
        body: 'test',
        out_trade_no: 'ORD001',
        total_fee: '100',
        spbill_create_ip: '127.0.0.1',
        notify_url: 'https://example.com/notify',
        trade_type: 'APP',
        sign: '',
      };

      const sortedKeys = Object.keys(params).filter(k => k !== 'sign' && params[k]).sort();
      const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + `&key=${apiKey}`;
      const crypto = await import('crypto');
      const expectedSign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
      params.sign = expectedSign;

      const result = await verifyWechatPaySignature(params, apiKey);
      expect(result).toBe(true);
    });

    it('should reject an invalid signature', async () => {
      const params: Record<string, string> = {
        appid: 'wx123',
        mch_id: '123',
        sign: 'INVALID_SIGN',
      };

      const result = await verifyWechatPaySignature(params, 'test-key');
      expect(result).toBe(false);
    });
  });

  describe('createWechatPayUnifiedOrder', () => {
    const orderParams = {
      orderId: 'ORD-TEST-001',
      planName: '月度会员',
      amount: 29.99,
      clientIp: '127.0.0.1',
      notifyUrl: 'https://example.com/notify',
    };

    it('should create unified order and return pay params', async () => {
      mockAxios.post.mockResolvedValue({ data: successXml });

      const result = await createWechatPayUnifiedOrder(orderParams);

      expect(mockAxios.post).toHaveBeenCalled();
      expect(result).toHaveProperty('prepayId');
      expect(result).toHaveProperty('paySign');
      expect(result).toHaveProperty('nonceStr');
      expect(result).toHaveProperty('timestamp');
      expect(result.package).toBe('Sign=WXPay');
    });

    it('should convert amount to fen (cents)', async () => {
      mockAxios.post.mockResolvedValue({ data: successXml });

      await createWechatPayUnifiedOrder(orderParams);

      const axiosCall = mockAxios.post.mock.calls[0][1] as string;
      expect(axiosCall).toContain('2999'); // 29.99 * 100 = 2999
    });

    it('should throw when WeChat returns failure', async () => {
      mockAxios.post.mockResolvedValue({
        data: `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Invalid params]]></return_msg></xml>`,
      });

      await expect(createWechatPayUnifiedOrder(orderParams)).rejects.toThrow();
    });

    it('should handle network error gracefully', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(createWechatPayUnifiedOrder(orderParams)).rejects.toThrow('微信支付下单失败');
    });
  });

  describe('applyWechatPayRefund', () => {
    const refundParams = {
      transactionId: 'TXN-001',
      totalAmount: 29.99,
      refundAmount: 29.99,
      refundReason: '用户取消',
    };

    const refundSuccessXml = `<xml><return_code><![CDATA[SUCCESS]]></return_code><result_code><![CDATA[SUCCESS]]></result_code><refund_id><![CDATA[REF123456]]></refund_id></xml>`;

    it('should apply refund and return result', async () => {
      mockAxios.post.mockResolvedValue({ data: refundSuccessXml });

      const result = await applyWechatPayRefund(refundParams);

      expect(result).toHaveProperty('refundId');
      expect(result.refundStatus).toBe('SUCCESS');
      expect(mockAxios.post).toHaveBeenCalled();
    });

    it('should throw when refund fails', async () => {
      mockAxios.post.mockResolvedValue({
        data: `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[Refund declined]]></return_msg></xml>`,
      });

      await expect(applyWechatPayRefund(refundParams)).rejects.toThrow();
    });

    it('should handle network error gracefully', async () => {
      mockAxios.post.mockRejectedValue(new Error('Timeout'));

      await expect(applyWechatPayRefund(refundParams)).rejects.toThrow('微信退款失败');
    });
  });
});
