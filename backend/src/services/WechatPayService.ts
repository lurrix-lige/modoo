import axios from 'axios';
import * as crypto from 'crypto';
import { customError } from '../utils/errors';
import { config } from '../config';

export interface UnifiedOrderParams {
  orderId: string;
  planName: string;
  amount: number;
  clientIp: string;
  notifyUrl: string;
}

export interface PayParams {
  prepayId: string;
  paySign: string;
  nonceStr: string;
  timestamp: string;
  package: string;
}

export interface RefundParams {
  transactionId: string;
  totalAmount: number;
  refundAmount: number;
  refundReason?: string;
}

function generateSign(params: Record<string, string>, apiKey: string): string {
  const sortedKeys = Object.keys(params).sort();
  const signParts: string[] = [];

  for (const key of sortedKeys) {
    if (params[key] && params[key] !== '') {
      signParts.push(`${key}=${params[key]}`);
    }
  }

  signParts.push(`key=${apiKey}`);
  const signStr = signParts.join('&');

  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

function generateNonceStr(): string {
  return crypto.randomBytes(16).toString('hex');
}

async function parseXmlResponse(xml: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const regex = /<(\w+)><!\[CDATA\[([^\]]*)\]\]><\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

export async function createWechatPayUnifiedOrder(params: UnifiedOrderParams): Promise<PayParams> {
  const {
    orderId,
    planName,
    amount,
    clientIp,
    notifyUrl,
  } = params;

  const { wechat } = config;

  if (!wechat.appId || !wechat.mchId || !wechat.apiKey) {
    throw customError('CONFIG_ERROR', '微信支付配置不完整，请联系管理员', 500);
  }

  const baseUrl = wechat.isSandbox ? wechat.sandboxApi : wechat.payApi;
  const nonceStr = generateNonceStr();
  const totalFee = Math.round(amount * 100);

  const signParams: Record<string, string> = {
    appid: wechat.appId,
    mch_id: wechat.mchId,
    nonce_str: nonceStr,
    body: `Modoo会员-${planName}`,
    out_trade_no: orderId,
    total_fee: totalFee.toString(),
    spbill_create_ip: clientIp,
    notify_url: notifyUrl,
    trade_type: 'APP',
  };

  signParams.sign = generateSign(signParams, wechat.apiKey);

  const xmlBody = Object.entries(signParams)
    .map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`)
    .join('');
  const xmlRequest = `<xml>${xmlBody}</xml>`;

  try {
    const response = await axios.post(`${baseUrl}/pay/unifiedorder`, xmlRequest, {
      headers: { 'Content-Type': 'text/xml' },
    });

    const result = await parseXmlResponse(response.data);

    if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
      throw customError('WECHAT_PAY_FAILED', result.err_code_des || result.return_msg, 400);
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const packageStr = `Sign=WXPay`;

    const paySignParams: Record<string, string> = {
      appid: wechat.appId,
      partnerid: wechat.mchId,
      prepayid: result.prepay_id!,
      package: packageStr,
      nonce_str: nonceStr,
      timestamp,
    };
    paySignParams.sign = generateSign(paySignParams, wechat.apiKey);

    return {
      prepayId: result.prepay_id!,
      paySign: paySignParams.sign,
      nonceStr,
      timestamp,
      package: packageStr,
    };
  } catch (error: any) {
    if (error.code) throw error;
    throw customError('WECHAT_PAY_ERROR', `微信支付下单失败: ${error.message}`, 500);
  }
}

export async function verifyWechatPaySignature(params: Record<string, string>, apiKey: string): Promise<boolean> {
  const { sign, ...rest } = params;
  const calculatedSign = generateSign(rest, apiKey);
  return calculatedSign === sign;
}

export async function applyWechatPayRefund(params: RefundParams): Promise<{
  refundId: string;
  refundStatus: string;
}> {
  const {
    transactionId,
    totalAmount,
    refundAmount,
    refundReason,
  } = params;

  const { wechat } = config;

  if (!wechat.appId || !wechat.mchId || !wechat.apiKey) {
    throw customError('CONFIG_ERROR', '微信支付配置不完整', 500);
  }

  const baseUrl = wechat.isSandbox ? wechat.sandboxApi : wechat.payApi;
  const nonceStr = generateNonceStr();
  const totalFeeYuan = Math.round(totalAmount * 100);
  const refundFeeYuan = Math.round(refundAmount * 100);
  const outRefundNo = `REF${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const signParams: Record<string, string> = {
    appid: wechat.appId,
    mch_id: wechat.mchId,
    nonce_str: nonceStr,
    transaction_id: transactionId,
    out_refund_no: outRefundNo,
    total_fee: totalFeeYuan.toString(),
    refund_fee: refundFeeYuan.toString(),
  };

  if (refundReason) {
    signParams.refund_desc = refundReason;
  }

  signParams.sign = generateSign(signParams, wechat.apiKey);

  const xmlBody = Object.entries(signParams)
    .map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`)
    .join('');
  const xmlRequest = `<xml>${xmlBody}</xml>`;

  try {
    const response = await axios.post(`${baseUrl}/secapi/pay/refund`, xmlRequest, {
      headers: { 'Content-Type': 'text/xml' },
    });

    const result = await parseXmlResponse(response.data);

    if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
      throw customError('WECHAT_REFUND_FAILED', result.err_code_des || result.return_msg, 400);
    }

    return {
      refundId: result.refund_id || outRefundNo,
      refundStatus: 'SUCCESS',
    };
  } catch (error: any) {
    if (error.code) throw error;
    throw customError('WECHAT_REFUND_ERROR', `微信退款失败: ${error.message}`, 500);
  }
}

export function getWechatPayConfig() {
  const { wechat } = config;
  
  return {
    appId: wechat.appId,
    mchId: wechat.mchId,
    isSandbox: wechat.isSandbox,
  };
}