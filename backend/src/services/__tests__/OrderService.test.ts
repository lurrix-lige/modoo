import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/database', () => ({
  prisma: {
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
  },
}));

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
});
