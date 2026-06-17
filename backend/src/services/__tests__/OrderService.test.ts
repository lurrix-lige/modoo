import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/database', () => {
  const mockPrisma = {
    pricingPlan: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {},
    promotion: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
      update: vi.fn(),
    },
    benefit: {
      findMany: vi.fn(),
    },
    paymentTransaction: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
  mockPrisma.$transaction = vi.fn(async (fn: any) => fn(mockPrisma));
  return { prisma: mockPrisma };
});

vi.mock('../../utils/errors', () => {
  const actual = vi.importActual('../../utils/errors');
  return actual;
});

import { prisma } from '../../utils/database';
import {
  createOrder,
  cancelOrder,
  expirePendingOrders,
  getOrderById,
  getUserOrders,
  markOrderAsPaid,
  refundOrder,
  createTransaction,
  updateTransaction,
  getUserTransactions,
  getTransactionById,
  getOrderByOrderNo,
  updateOrder,
} from '../OrderService';

const mockPlan = {
  id: 'plan-1',
  planKey: 'monthly',
  nameKey: 'plan.monthly.name',
  currentPrice: 29.99,
  originalPrice: 39.99,
  durationDays: 30,
  isActive: true,
  features: JSON.stringify(['feature-a', 'feature-b']),
  notIncluded: JSON.stringify([]),
  metadata: null,
};

const mockOrder = {
  id: 'order-1',
  orderNo: 'ORD-TEST001',
  userId: 'user-1',
  status: 'PENDING',
  totalAmount: 29.99,
  discountAmount: 0,
  finalAmount: 29.99,
  paymentMethod: null,
  refundAmount: 0,
  metadata: null,
  subscriptionId: null,
  items: [
    {
      planId: 'plan-1',
      planSnapshot: JSON.stringify({
        id: 'plan-1',
        planKey: 'monthly',
        nameKey: 'plan.monthly.name',
        price: 29.99,
        durationDays: 30,
      }),
      quantity: 1,
      unitPrice: 29.99,
      discountAmount: 0,
      finalPrice: 29.99,
    },
  ],
  transactions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransaction = {
  id: 'txn-1',
  orderId: 'order-1',
  userId: 'user-1',
  type: 'PAYMENT',
  status: 'SUCCESS',
  amount: 29.99,
  currency: 'CNY',
  paymentMethod: 'WECHAT_PAY',
  transactionId: 'TXN-12345',
  gatewayResponse: JSON.stringify({ status: 'SUCCESS' }),
  createdAt: new Date(),
};

const mockSubscription = {
  id: 'sub-1',
  userId: 'user-1',
  planId: 'plan-1',
  status: 'ACTIVE',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
  autoRenew: true,
  plan: mockPlan,
  benefits: [{ benefitId: 'ben-1', benefit: { id: 'ben-1', benefitKey: 'hd_audio', value: '{"maxViews":100}' } }],
};

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should throw error when pricing plan is not found', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(null);

      await expect(
        createOrder({ userId: 'user-1', planId: 'nonexistent' })
      ).rejects.toThrow('定价方案不存在或已停用');
    });

    it('should throw error when plan is inactive', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue({
        ...mockPlan,
        isActive: false,
      } as any);

      await expect(
        createOrder({ userId: 'user-1', planId: 'plan-1' })
      ).rejects.toThrow('定价方案不存在或已停用');
    });

    it('should create an order with correct amounts', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder as any);

      const result = await createOrder({ userId: 'user-1', planId: 'plan-1' });

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            totalAmount: 29.99,
            finalAmount: 29.99,
            status: 'PENDING',
          }),
        })
      );
      expect(result.orderNo).toMatch(/^ORD/);
    });

    it('should apply percentage-off promotion correctly', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.promotion.findFirst).mockResolvedValue({
        id: 'promo-1',
        code: 'SAVE50',
        type: 'PERCENTAGE_OFF',
        value: 50,
        isActive: true,
        usageCount: 0,
        usageLimit: 100,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-01-01'),
        maxDiscount: null,
        minPurchase: null,
      } as any);
      vi.mocked(prisma.promotion.update).mockResolvedValue({} as any);
      vi.mocked(prisma.order.create).mockResolvedValue({
        ...mockOrder,
        discountAmount: 15,
        finalAmount: 15,
      } as any);

      const result = await createOrder({
        userId: 'user-1',
        planId: 'plan-1',
        promotionCode: 'SAVE50',
      });

      expect(result.discountAmount).toBe(15);
      expect(result.finalAmount).toBe(15);
    });
  });

  describe('cancelOrder', () => {
    it('should throw error when order is not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(cancelOrder('nonexistent')).rejects.toThrow('订单不存在');
    });

    it('should throw error when cancelling completed order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: 'COMPLETED',
      } as any);

      await expect(cancelOrder('order-1')).rejects.toThrow('无法取消');
    });

    it('should cancel a pending order directly', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: 'PENDING',
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({} as any);

      await cancelOrder('order-1', '测试取消');

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
            cancelReason: '测试取消',
          }),
        })
      );
    });
  });

  describe('expirePendingOrders', () => {
    it('should expire orders older than 24 hours', async () => {
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 3 } as any);

      await expirePendingOrders();

      expect(prisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
          data: expect.objectContaining({
            status: 'EXPIRED',
          }),
        })
      );
    });
  });

  describe('getOrderById', () => {
    it('should return null when order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await getOrderById('nonexistent');
      expect(result).toBeNull();
    });

    it('should parse planSnapshot JSON in returned order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        metadata: null,
        subscription: null,
      } as any);

      const result = await getOrderById('order-1');
      expect(result).not.toBeNull();
      expect(typeof result!.items[0].planSnapshot).toBe('object');
      expect(result!.items[0].planSnapshot.planKey).toBe('monthly');
    });
  });

  describe('getOrderByOrderNo', () => {
    it('should return null when order number not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await getOrderByOrderNo('ORD-NONEXISTENT');
      expect(result).toBeNull();
    });

    it('should find order by order number', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        subscription: null,
      } as any);

      const result = await getOrderByOrderNo('ORD-TEST001');
      expect(result).not.toBeNull();
      expect(result!.orderNo).toBe('ORD-TEST001');
      expect(prisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orderNo: 'ORD-TEST001' } })
      );
    });
  });

  describe('getUserOrders', () => {
    it('should return parsed orders for user', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([mockOrder as any]);

      const results = await getUserOrders('user-1');
      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe('user-1');
    });

    it('should filter by status when provided', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      await getUserOrders('user-1', 'PAID');

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', status: 'PAID' } })
      );
    });
  });

  describe('updateOrder', () => {
    it('should throw error when order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(updateOrder('nonexistent', { status: 'PAID' })).rejects.toThrow('订单不存在');
    });

    it('should update order status', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue({ ...mockOrder, status: 'PAID' } as any);

      await updateOrder('order-1', { status: 'PAID', paidAt: new Date() });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({ status: 'PAID' }),
        })
      );
    });
  });

  describe('markOrderAsPaid', () => {
    it('should throw error when order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(markOrderAsPaid('nonexistent', 'TXN-1', 'WECHAT_PAY')).rejects.toThrow('订单不存在');
    });

    it('should throw error when order is not PENDING', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: 'COMPLETED',
        items: mockOrder.items,
      } as any);

      await expect(markOrderAsPaid('order-1', 'TXN-1', 'WECHAT_PAY')).rejects.toThrow('只能支付待支付状态的订单');
    });

    it('should mark order as paid and create subscription', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: 'PENDING',
        items: mockOrder.items,
      } as any);
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.subscription.create).mockResolvedValue(mockSubscription as any);
      vi.mocked(prisma.order.update).mockResolvedValue({} as any);
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue(mockTransaction as any);

      const result = await markOrderAsPaid('order-1', 'TXN-12345', 'WECHAT_PAY');

      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            status: 'ACTIVE',
          }),
        })
      );
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('refundOrder', () => {
    it('should throw error when order not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      await expect(refundOrder('nonexistent', 10, 'reason')).rejects.toThrow('订单不存在');
    });

    it('should throw error when order status is invalid for refund', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: 'PENDING',
        transactions: [],
        refundAmount: 0,
      } as any);

      await expect(refundOrder('order-1', 10, 'reason')).rejects.toThrow('只有已支付或已完成的订单才能退款');
    });

    it('should throw error when refund amount exceeds max', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: 'COMPLETED',
        finalAmount: 10,
        refundAmount: 5,
        transactions: [],
      } as any);

      await expect(refundOrder('order-1', 10, 'reason')).rejects.toThrow('退款金额超过可退金额');
    });

    it('should process full refund and cancel subscription', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: 'COMPLETED',
        finalAmount: 29.99,
        refundAmount: 0,
        subscriptionId: 'sub-1',
        transactions: [],
      } as any);
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue(mockTransaction as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        status: 'REFUNDED',
        refundAmount: 29.99,
        items: mockOrder.items,
      } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);

      const result = await refundOrder('order-1', 29.99, '用户申请');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({ status: 'CANCELLED' }),
        })
      );
      expect(result.refundTransaction).toBeDefined();
    });
  });

  describe('createTransaction', () => {
    it('should create a payment transaction', async () => {
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue(mockTransaction as any);

      await createTransaction({
        orderId: 'order-1',
        userId: 'user-1',
        type: 'PAYMENT',
        amount: 29.99,
        paymentMethod: 'WECHAT_PAY',
        transactionId: 'TXN-12345',
      });

      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'order-1',
          type: 'PAYMENT',
          amount: 29.99,
          currency: 'CNY',
          status: 'PENDING',
        }),
      });
    });

    it('should set status to SUCCESS for refund transactions', async () => {
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue({
        ...mockTransaction,
        type: 'REFUND',
        status: 'SUCCESS',
        amount: -10,
      } as any);

      await createTransaction({
        userId: 'user-1',
        type: 'REFUND',
        amount: -10,
        transactionId: 'REF-001',
      });

      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'REFUND',
          status: 'SUCCESS',
        }),
      });
    });
  });

  describe('updateTransaction', () => {
    it('should throw error when transaction not found', async () => {
      vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue(null);

      await expect(updateTransaction('nonexistent', { status: 'SUCCESS' })).rejects.toThrow('交易记录不存在');
    });

    it('should update transaction status', async () => {
      vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue(mockTransaction as any);
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({
        ...mockTransaction,
        status: 'FAILED',
        gatewayResponse: JSON.stringify({ error: 'timeout' }),
      } as any);

      await updateTransaction('txn-1', {
        status: 'FAILED',
        gatewayResponse: { error: 'timeout' },
      });

      expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'txn-1' },
          data: expect.objectContaining({
            status: 'FAILED',
            gatewayResponse: JSON.stringify({ error: 'timeout' }),
          }),
        })
      );
    });
  });

  describe('getUserTransactions', () => {
    it('should return parsed transactions for user', async () => {
      vi.mocked(prisma.paymentTransaction.findMany).mockResolvedValue([mockTransaction as any]);

      const results = await getUserTransactions('user-1');

      expect(results).toHaveLength(1);
      expect(results[0].gatewayResponse).toEqual({ status: 'SUCCESS' });
    });

    it('should filter by type', async () => {
      vi.mocked(prisma.paymentTransaction.findMany).mockResolvedValue([]);

      await getUserTransactions('user-1', 'REFUND');

      expect(prisma.paymentTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', type: 'REFUND' } })
      );
    });
  });

  describe('getTransactionById', () => {
    it('should return null when not found', async () => {
      vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue(null);

      const result = await getTransactionById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return parsed transaction with order', async () => {
      vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue({
        ...mockTransaction,
        order: mockOrder,
      } as any);

      const result = await getTransactionById('txn-1');
      expect(result).not.toBeNull();
      expect(result!.gatewayResponse).toEqual({ status: 'SUCCESS' });
      expect(result!.order).toBeDefined();
    });
  });
});
