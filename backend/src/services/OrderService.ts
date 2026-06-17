import { prisma } from "../utils/database";
import { customError } from "../utils/errors";
import { nanoid } from "nanoid";

export type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'PARTIAL_REFUND' | 'EXPIRED';

export type PaymentMethod = 'WECHAT_PAY' | 'ALIPAY' | 'APPLE_PAY' | 'BANK_TRANSFER' | 'CREDIT_CARD';

export type TransactionType = 'PAYMENT' | 'REFUND' | 'RENEWAL';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface CreateOrderOptions {
  userId: string;
  planId: string;
  quantity?: number;
  promotionCode?: string;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, any>;
}

export interface CreateTransactionOptions {
  orderId?: string;
  subscriptionId?: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
}

function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(8).toUpperCase();
  return `ORD${timestamp}${random}`;
}

export async function createOrder(options: CreateOrderOptions): Promise<any> {
  const { userId, planId, quantity = 1, promotionCode, paymentMethod, metadata } = options;

  const plan = await prisma.pricingPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || !plan.isActive) {
    throw customError('NOT_FOUND', '定价方案不存在或已停用', 404);
  }

  let discountAmount = 0;
  let promotion = null;

  if (promotionCode) {
    promotion = await prisma.promotion.findFirst({
      where: {
        code: promotionCode,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    if (promotion) {
      const totalAmount = plan.currentPrice * quantity;
      if (promotion.minPurchase && totalAmount < promotion.minPurchase) {
        throw customError('INVALID_PROMOTION', '未达到最低消费金额', 400);
      }

      if (promotion.type === 'PERCENTAGE_OFF') {
        const discount = totalAmount * (promotion.value / 100);
        discountAmount = promotion.maxDiscount ? Math.min(discount, promotion.maxDiscount) : discount;
      } else if (promotion.type === 'FIXED_AMOUNT_OFF') {
        discountAmount = promotion.maxDiscount ? Math.min(promotion.value, promotion.maxDiscount) : promotion.value;
      }
    }
  }

  const totalAmount = plan.currentPrice * quantity;
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const orderNo = generateOrderNo();

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNo,
        userId,
        status: 'PENDING',
        totalAmount,
        discountAmount,
        finalAmount,
        paymentMethod,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
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
            quantity,
            unitPrice: plan.currentPrice,
            discountAmount,
            finalPrice: finalAmount,
          },
        },
      },
      include: { items: true },
    });

    if (promotion) {
      const currentPromo = await tx.promotion.findUnique({ where: { id: promotion.id } });
      if (currentPromo?.usageLimit && currentPromo.usageCount >= currentPromo.usageLimit) {
        throw customError('PROMOTION_EXHAUSTED', '优惠码已被使用完毕', 400);
      }
      await tx.promotion.update({
        where: { id: promotion.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    return newOrder;
  });

  return {
    ...order,
    items: order.items.map(item => ({
      ...item,
      planSnapshot: JSON.parse(item.planSnapshot),
    })),
    metadata: metadata || null,
  };
}

export async function getOrderById(orderId: string): Promise<any | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      transactions: true,
      subscription: true,
    },
  });

  if (!order) return null;

  return {
    ...order,
    items: order.items.map(item => ({
      ...item,
      planSnapshot: JSON.parse(item.planSnapshot),
    })),
    metadata: order.metadata ? JSON.parse(order.metadata) : null,
    subscription: order.subscription ? {
      ...order.subscription,
    } : null,
  };
}

export async function getOrderByOrderNo(orderNo: string): Promise<any | null> {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      items: true,
      transactions: true,
      subscription: true,
    },
  });

  if (!order) return null;

  return {
    ...order,
    items: order.items.map(item => ({
      ...item,
      planSnapshot: JSON.parse(item.planSnapshot),
    })),
    metadata: order.metadata ? JSON.parse(order.metadata) : null,
    subscription: order.subscription ? {
      ...order.subscription,
    } : null,
  };
}

export async function getUserOrders(userId: string, status?: OrderStatus): Promise<any[]> {
  const where: Record<string, any> = { userId };
  status && (where.status = status);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: true, transactions: true },
  });

  return orders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      planSnapshot: JSON.parse(item.planSnapshot),
    })),
    metadata: order.metadata ? JSON.parse(order.metadata) : null,
  }));
}

export async function updateOrder(orderId: string, data: Partial<{
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentChannel: string;
  transactionId: string;
  paidAt: Date;
  completedAt: Date;
  cancelledAt: Date;
  cancelReason: string;
  refundAmount: number;
  refundedAt: Date;
  refundReason: string;
}>): Promise<any> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw customError('NOT_FOUND', '订单不存在', 404);
  }

  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: { items: true },
  });

  return {
    ...updated,
    items: updated.items.map(item => ({
      ...item,
      planSnapshot: JSON.parse(item.planSnapshot),
    })),
    metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
  };
}

export async function markOrderAsPaid(orderId: string, transactionId: string, paymentMethod: PaymentMethod): Promise<any> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw customError('NOT_FOUND', '订单不存在', 404);
  }

  if (order.status !== 'PENDING') {
    throw customError('INVALID_STATUS', '只能支付待支付状态的订单', 400);
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
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      subscriptionId: subscription.id,
      transactionId,
      paymentMethod,
      paidAt: now,
      completedAt: now,
    },
  });

  await createTransaction({
    orderId,
    subscriptionId: subscription.id,
    userId: order.userId,
    type: 'PAYMENT',
    amount: order.finalAmount,
    paymentMethod,
    transactionId,
    gatewayResponse: { status: 'SUCCESS' },
  });

  return {
    ...order,
    subscriptionId: subscription.id,
    status: 'COMPLETED' as OrderStatus,
    items: order.items.map(item => ({
      ...item,
      planSnapshot,
    })),
    subscription: {
      ...subscription,
      plan: {
        ...subscription.plan,
        features: subscription.plan.features ? JSON.parse(subscription.plan.features) : null,
      },
      benefits: subscription.benefits.map(sb => ({
        ...sb,
        benefit: {
          ...sb.benefit,
          value: sb.benefit.value ? JSON.parse(sb.benefit.value) : null,
        },
      })),
    },
  };
}

export async function cancelOrder(orderId: string, reason?: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw customError('NOT_FOUND', '订单不存在', 404);
  }

  if (order.status === 'COMPLETED' || order.status === 'REFUNDED') {
    throw customError('INVALID_STATUS', '已完成或已退款的订单无法取消', 400);
  }

  if (order.status === 'PAID') {
    await refundOrder(orderId, order.finalAmount, reason || '用户取消订单');
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: reason,
    },
  });
}

export async function refundOrder(orderId: string, amount: number, reason?: string): Promise<any> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { transactions: true },
  });

  if (!order) {
    throw customError('NOT_FOUND', '订单不存在', 404);
  }

  if (order.status !== 'PAID' && order.status !== 'COMPLETED') {
    throw customError('INVALID_STATUS', '只有已支付或已完成的订单才能退款', 400);
  }

  const totalRefunded = order.refundAmount || 0;
  const maxRefund = order.finalAmount - totalRefunded;

  if (amount > maxRefund) {
    throw customError('INVALID_AMOUNT', `退款金额超过可退金额，最大可退: ${maxRefund}`, 400);
  }

  const transaction = await createTransaction({
    orderId,
    userId: order.userId,
    type: 'REFUND',
    amount: -amount,
    transactionId: `REF${Date.now()}`,
    gatewayResponse: { status: 'SUCCESS' },
  });

  const newStatus = totalRefunded + amount >= order.finalAmount ? 'REFUNDED' : 'PARTIAL_REFUND';

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      refundAmount: (order.refundAmount || 0) + amount,
      refundedAt: new Date(),
      refundReason: reason,
    },
    include: { items: true },
  });

  if (newStatus === 'REFUNDED' && order.subscriptionId) {
    await prisma.subscription.update({
      where: { id: order.subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        terminationReason: '订单已退款',
      },
    });
  }

  return {
    ...updatedOrder,
    refundTransaction: transaction,
    items: updatedOrder.items.map(item => ({
      ...item,
      planSnapshot: JSON.parse(item.planSnapshot),
    })),
  };
}

export async function createTransaction(options: CreateTransactionOptions): Promise<any> {
  const { orderId, subscriptionId, userId, type, amount, currency = 'CNY', paymentMethod, transactionId, gatewayResponse } = options;

  const transaction = await prisma.paymentTransaction.create({
    data: {
      orderId,
      subscriptionId,
      userId,
      type,
      status: gatewayResponse?.status === 'SUCCESS' ? 'SUCCESS' : type === 'REFUND' ? 'SUCCESS' : 'PENDING',
      amount,
      currency,
      paymentMethod,
      transactionId,
      gatewayResponse: gatewayResponse ? JSON.stringify(gatewayResponse) : undefined,
    },
  });

  return {
    ...transaction,
    gatewayResponse: gatewayResponse || null,
  };
}

export async function updateTransaction(transactionId: string, data: Partial<{
  status: TransactionStatus;
  gatewayResponse: Record<string, any>;
  failureReason: string;
}>): Promise<any> {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw customError('NOT_FOUND', '交易记录不存在', 404);
  }

  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = key === 'gatewayResponse' ? JSON.stringify(value) : value;
    }
  });

  const updated = await prisma.paymentTransaction.update({
    where: { id: transactionId },
    data: updateData,
  });

  return {
    ...updated,
    gatewayResponse: updated.gatewayResponse ? JSON.parse(updated.gatewayResponse) : null,
  };
}

export async function getUserTransactions(userId: string, type?: TransactionType): Promise<any[]> {
  const where: Record<string, any> = { userId };
  type && (where.type = type);

  const transactions = await prisma.paymentTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return transactions.map(t => ({
    ...t,
    gatewayResponse: t.gatewayResponse ? JSON.parse(t.gatewayResponse) : null,
  }));
}

export async function getTransactionById(transactionId: string): Promise<any | null> {
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
    include: { order: true },
  });

  if (!transaction) return null;

  return {
    ...transaction,
    gatewayResponse: transaction.gatewayResponse ? JSON.parse(transaction.gatewayResponse) : null,
    order: transaction.order ? {
      ...transaction.order,
      metadata: transaction.order.metadata ? JSON.parse(transaction.order.metadata) : null,
    } : null,
  };
}

export async function expirePendingOrders(): Promise<void> {
  const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await prisma.order.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: expiryTime },
    },
    data: {
      status: 'EXPIRED',
      expiredAt: new Date(),
    },
  });
}