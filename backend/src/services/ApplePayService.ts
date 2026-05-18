import { customError } from '../utils/errors';
import { prisma } from '../utils/database';
import crypto from 'crypto';
import { config } from '../config';

export interface CreateApplePaySessionParams {
  planId: string;
  userId: string;
}

export interface ApplePaySessionResult {
  orderId: string;
  orderNo: string;
  countryCode: string;
  currencyCode: string;
  merchantIdentifier: string;
  merchantId: string;
  total: {
    label: string;
    amount: string;
    type: string;
  };
  lineItems: Array<{
    label: string;
    amount: string;
  }>;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  metadata: {
    orderId: string;
  };
}

export interface VerifyApplePayPaymentParams {
  paymentData: string;
  orderNo?: string;
  orderId?: string;
}

export interface VerifyApplePayPaymentResult {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  error?: string;
}

export async function createApplePaySession(params: CreateApplePaySessionParams): Promise<ApplePaySessionResult> {
  const { planId, userId } = params;
  const { applePay } = config;
  
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw customError('INVALID_PLAN', '会员计划不存在', 404);
  }

  const orderNo = generateOrderNo();

  const order = await prisma.order.create({
    data: {
      orderNo,
      userId,
      status: 'PENDING',
      totalAmount: plan.currentPrice,
      discountAmount: 0,
      finalAmount: plan.currentPrice,
      paymentMethod: 'APPLE_PAY',
      items: {
        create: {
          planId,
          planSnapshot: JSON.stringify({
            id: plan.id,
            planKey: plan.planKey,
            nameKey: plan.nameKey,
            price: plan.currentPrice,
            durationDays: plan.durationDays,
          }),
          quantity: 1,
          unitPrice: plan.currentPrice,
          discountAmount: 0,
          finalPrice: plan.currentPrice,
        },
      },
    },
    include: { items: true },
  });

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    countryCode: applePay.countryCode,
    currencyCode: applePay.currencyCode,
    merchantIdentifier: applePay.merchantId,
    merchantId: applePay.merchantId,
    total: {
      label: applePay.displayName,
      amount: plan.currentPrice.toFixed(2),
      type: 'final',
    },
    lineItems: [
      {
        label: applePay.displayName,
        amount: plan.currentPrice.toFixed(2),
      },
    ],
    supportedNetworks: applePay.supportedNetworks,
    merchantCapabilities: applePay.merchantCapabilities,
    metadata: {
      orderId: order.orderNo,
    },
  };
}

export async function verifyApplePayPayment(params: VerifyApplePayPaymentParams): Promise<VerifyApplePayPaymentResult> {
  const { paymentData, orderNo, orderId } = params;

  let order;
  if (orderNo) {
    order = await prisma.order.findUnique({
      where: { orderNo },
      include: { items: true },
    });
  } else if (orderId) {
    order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  }

  if (!order) {
    throw customError('ORDER_NOT_FOUND', '订单不存在', 404);
  }

  if (order.status !== 'PENDING') {
    throw customError('ORDER_STATUS_ERROR', '订单状态不正确', 400);
  }

  try {
    const paymentDataObj = JSON.parse(paymentData);
    
    await validateApplePayPaymentData(paymentDataObj, order.finalAmount);

    const transactionId = paymentDataObj.paymentData?.transactionId || paymentDataObj.transactionId;

    if (!transactionId) {
      throw customError('INVALID_PAYMENT_DATA', '缺少交易ID', 400);
    }

    const now = new Date();
    const planSnapshot = JSON.parse(order.items[0].planSnapshot);
    const durationDays = planSnapshot.durationDays || 30;
    const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const benefits = await prisma.benefit.findMany({
      where: { isActive: true },
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId: order.userId,
        planId: order.items[0].planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd,
        benefits: {
          create: benefits.map(benefit => ({
            benefitId: benefit.id,
            expiresAt: currentPeriodEnd,
            usageLimit: benefit.value ? JSON.parse(benefit.value)?.maxUsages : undefined,
          })),
        },
      },
      include: {
        plan: true,
        benefits: { include: { benefit: true } },
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        subscriptionId: subscription.id,
        completedAt: now,
        transactionId,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        subscriptionId: subscription.id,
        userId: order.userId,
        type: 'PAYMENT',
        status: 'SUCCESS',
        amount: order.finalAmount,
        currency: 'CNY',
        paymentMethod: 'APPLE_PAY',
        transactionId,
      },
    });

    return {
      success: true,
      orderId: order.id,
      transactionId,
    };
  } catch (error: any) {
    if (error.code) {
      throw error;
    }
    throw customError('PAYMENT_VERIFY_FAILED', error.message || '支付验证失败', 400);
  }
}

export async function formatApplePayOrder(orderNo: string, itemName: string, amount: number) {
  const { applePay } = config;
  
  return {
    countryCode: applePay.countryCode,
    currencyCode: applePay.currencyCode,
    merchantIdentifier: applePay.merchantId,
    merchantCapabilities: applePay.merchantCapabilities,
    supportedNetworks: applePay.supportedNetworks,
    total: {
      label: itemName,
      amount: amount.toFixed(2),
      type: 'final',
    },
    lineItems: [
      {
        label: itemName,
        amount: amount.toFixed(2),
      },
    ],
    metadata: {
      orderId: orderNo,
    },
  };
}

async function validateApplePayPaymentData(paymentData: any, expectedAmount: number): Promise<void> {
  if (!paymentData || (!paymentData.paymentData && !paymentData.transactionId)) {
    throw customError('INVALID_PAYMENT_DATA', '支付数据无效', 400);
  }

  const actualPaymentData = paymentData.paymentData || paymentData;
  const { transactionId, amount } = actualPaymentData;

  if (!transactionId) {
    throw customError('INVALID_PAYMENT_DATA', '缺少交易ID', 400);
  }

  if (amount) {
    const paymentAmount = parseFloat(amount);
    if (Math.abs(paymentAmount - expectedAmount) > 0.01) {
      throw customError('AMOUNT_MISMATCH', '支付金额不匹配', 400);
    }
  }
}

function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `APL${timestamp}${random}`;
}

export function getApplePayConfig() {
  const { applePay } = config;
  
  return {
    merchantIdentifier: applePay.merchantId,
    merchantId: applePay.merchantId,
    countryCode: applePay.countryCode,
    currencyCode: applePay.currencyCode,
    displayName: applePay.displayName,
    supportedNetworks: applePay.supportedNetworks,
    merchantCapabilities: applePay.merchantCapabilities,
  };
}