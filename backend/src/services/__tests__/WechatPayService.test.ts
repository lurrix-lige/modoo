import { describe, it, expect } from 'vitest';
import { generateSign, generateNonceStr, parseXmlResponse, verifyWechatPaySignature, getWechatPayConfig } from '../WechatPayService';

// We need access to internal functions. Since they're not exported,
// we test the public API that exercises them.

describe('WechatPayService', () => {
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

      // Build expected sign manually (same algorithm as generateSign)
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
});
