import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/database', () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pricingPlan: {
      findUnique: vi.fn(),
    },
    benefit: {
      findMany: vi.fn(),
    },
    subscriptionBenefit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    productBenefit: {},
  },
}));

vi.mock('../../utils/errors', () => {
  const actual = vi.importActual('../../utils/errors');
  return actual;
});

import { prisma } from '../../utils/database';
import {
  getSubscriptionById,
  getActiveSubscription,
  getUserSubscriptions,
  createSubscription,
  updateSubscription,
  renewSubscription,
  cancelSubscription,
  expireSubscription,
  checkSubscriptionStatus,
  incrementBenefitUsage,
  getSubscriptionBenefits,
} from '../SubscriptionService';

const mockPlan = {
  id: 'plan-1',
  planKey: 'monthly',
  nameKey: 'plan.monthly.name',
  currentPrice: 29.99,
  originalPrice: 39.99,
  durationDays: 30,
  features: JSON.stringify(['高清音频', '无限故事']),
  notIncluded: null,
  metadata: JSON.stringify({ badge: 'popular' }),
};

const mockSub = {
  id: 'sub-1',
  userId: 'user-1',
  planId: 'plan-1',
  status: 'ACTIVE',
  autoRenew: true,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
  cancelAtPeriodEnd: false,
  cancellationReason: null,
  cancelledAt: null,
  externalSubId: null,
  plan: mockPlan,
  benefits: [
    {
      benefitId: 'ben-1',
      benefit: { id: 'ben-1', benefitKey: 'hd_audio', nameKey: '高清音频', value: '{"maxViews":100}', type: 'FEATURE', isActive: true },
      usageCount: 0,
      usageLimit: 100,
      expiresAt: new Date(Date.now() + 30 * 86400000),
      metadata: null,
    },
  ],
  orders: [],
  transactions: [],
};

describe('SubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubscriptionById', () => {
    it('should return null when subscription not found', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      const result = await getSubscriptionById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return parsed subscription with plan features and benefits', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(mockSub as any);

      const result = await getSubscriptionById('sub-1');
      expect(result).not.toBeNull();
      expect(result.id).toBe('sub-1');
      expect(Array.isArray(result.plan.features)).toBe(true);
      expect(result.plan.features).toEqual(['高清音频', '无限故事']);
      expect(result.plan.notIncluded).toBeNull();
      expect(result.plan.metadata).toEqual({ badge: 'popular' });
      expect(result.benefits[0].benefit.value).toEqual({ maxViews: 100 });
    });
  });

  describe('getActiveSubscription', () => {
    it('should return null when no active subscription', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      const result = await getActiveSubscription('user-1');
      expect(result).toBeNull();
    });

    it('should find active subscription by userId', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockSub as any);

      const result = await getActiveSubscription('user-1');

      expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            status: 'ACTIVE',
            currentPeriodEnd: expect.objectContaining({ gt: expect.any(Date) }),
          },
        })
      );
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('getUserSubscriptions', () => {
    it('should return parsed subscriptions list', async () => {
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([mockSub as any]);

      const results = await getUserSubscriptions('user-1');

      expect(results).toHaveLength(1);
      expect(results[0].plan.features).toEqual(['高清音频', '无限故事']);
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('createSubscription', () => {
    it('should throw error when plan not found', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(null);

      await expect(
        createSubscription({ userId: 'user-1', planId: 'nonexistent' })
      ).rejects.toThrow('定价方案不存在');
    });

    it('should create subscription with benefits', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([
        { id: 'ben-1', value: JSON.stringify({ maxViews: 100 }), isActive: true, productBenefits: [] },
      ] as any);
      vi.mocked(prisma.subscription.create).mockResolvedValue({ ...mockSub, benefits: mockSub.benefits } as any);

      const result = await createSubscription({
        userId: 'user-1',
        planId: 'plan-1',
      });

      expect(prisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            planId: 'plan-1',
            status: 'ACTIVE',
            autoRenew: true,
          }),
        })
      );
      expect(result.plan.features).toEqual(['高清音频', '无限故事']);
    });

    it('should use provided durationDays over plan default', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.subscription.create).mockResolvedValue({ ...mockSub, benefits: [] } as any);

      await createSubscription({
        userId: 'user-1',
        planId: 'plan-1',
        durationDays: 60,
      });

      const createCall = vi.mocked(prisma.subscription.create).mock.calls[0][0];
      const periodEnd = createCall.data.currentPeriodEnd as Date;
      const diffMs = periodEnd.getTime() - (createCall.data.currentPeriodStart as Date).getTime();
      expect(diffMs).toBe(60 * 24 * 60 * 60 * 1000);
    });
  });

  describe('updateSubscription', () => {
    it('should throw error when subscription not found', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      await expect(
        updateSubscription('nonexistent', { status: 'ACTIVE' })
      ).rejects.toThrow('订阅不存在');
    });

    it('should update subscription fields', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue(mockSub as any);

      await updateSubscription('sub-1', {
        status: 'CANCELLED',
        terminationReason: '用户取消',
      });

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({
            status: 'CANCELLED',
            terminationReason: '用户取消',
          }),
        })
      );
    });

    it('should set cancelledAt when status changes to CANCELLED', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ ...mockSub, cancelledAt: null } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue(mockSub as any);

      await updateSubscription('sub-1', { status: 'CANCELLED' });

      const updateCall = vi.mocked(prisma.subscription.update).mock.calls[0][0];
      expect(updateCall.data.cancelledAt).toBeInstanceOf(Date);
    });
  });

  describe('renewSubscription', () => {
    it('should throw error when subscription not found', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      await expect(renewSubscription('nonexistent')).rejects.toThrow('订阅不存在');
    });

    it('should throw error when subscription is not active', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        ...mockSub,
        status: 'EXPIRED',
        plan: { durationDays: 30 },
      } as any);

      await expect(renewSubscription('sub-1')).rejects.toThrow('只能续订活跃状态的订阅');
    });

    it('should extend period and reset benefit usage', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        ...mockSub,
        status: 'ACTIVE',
        plan: { durationDays: 30 },
        currentPeriodEnd: new Date('2025-01-31'),
      } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.subscriptionBenefit.updateMany).mockResolvedValue({ count: 1 } as any);

      await renewSubscription('sub-1');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentPeriodStart: expect.any(Date),
            currentPeriodEnd: expect.any(Date),
          }),
        })
      );
      expect(prisma.subscriptionBenefit.updateMany).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-1' },
        data: { expiresAt: expect.any(Date), usageCount: 0 },
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should delegate to updateSubscription with CANCELLED status', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue(mockSub as any);

      await cancelSubscription('sub-1', '不想续费');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({
            status: 'CANCELLED',
            terminationReason: '不想续费',
            cancelAtPeriodEnd: true,
          }),
        })
      );
    });
  });

  describe('expireSubscription', () => {
    it('should delegate to updateSubscription with EXPIRED status', async () => {
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue(mockSub as any);

      await expireSubscription('sub-1');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'EXPIRED',
            terminationReason: '自动到期',
          }),
        })
      );
    });
  });

  describe('checkSubscriptionStatus', () => {
    it('should return inactive when no subscription', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

      const result = await checkSubscriptionStatus('user-1');
      expect(result.hasActiveSubscription).toBe(false);
    });

    it('should return active with expiration', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockSub as any);

      const result = await checkSubscriptionStatus('user-1');
      expect(result.hasActiveSubscription).toBe(true);
      expect(result.expiresAt).toBeDefined();
    });
  });

  describe('incrementBenefitUsage', () => {
    it('should throw error when subscription benefit not found', async () => {
      vi.mocked(prisma.subscriptionBenefit.findUnique).mockResolvedValue(null);

      await expect(
        incrementBenefitUsage('sub-1', 'ben-1')
      ).rejects.toThrow('订阅权益不存在');
    });

    it('should throw error when usage limit exceeded', async () => {
      vi.mocked(prisma.subscriptionBenefit.findUnique).mockResolvedValue({
        usageCount: 100,
        usageLimit: 100,
      } as any);

      await expect(
        incrementBenefitUsage('sub-1', 'ben-1')
      ).rejects.toThrow('权益使用次数已达上限');
    });

    it('should increment usage count', async () => {
      vi.mocked(prisma.subscriptionBenefit.findUnique).mockResolvedValue({
        usageCount: 5,
        usageLimit: 100,
      } as any);
      vi.mocked(prisma.subscriptionBenefit.update).mockResolvedValue({} as any);

      await incrementBenefitUsage('sub-1', 'ben-1');

      expect(prisma.subscriptionBenefit.update).toHaveBeenCalledWith({
        where: { subscriptionId_benefitId: { subscriptionId: 'sub-1', benefitId: 'ben-1' } },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getSubscriptionBenefits', () => {
    it('should return parsed benefits list', async () => {
      vi.mocked(prisma.subscriptionBenefit.findMany).mockResolvedValue([
        {
          benefitId: 'ben-1',
          benefit: { id: 'ben-1', benefitKey: 'hd_audio', nameKey: '高清音频', value: '{"maxViews":100}' },
          usageCount: 3,
          usageLimit: 100,
          metadata: '{"note":"test"}',
          expiresAt: new Date(),
        },
      ] as any);

      const results = await getSubscriptionBenefits('sub-1');
      expect(results).toHaveLength(1);
      expect(results[0].benefit.value).toEqual({ maxViews: 100 });
      expect(results[0].metadata).toEqual({ note: 'test' });
    });
  });
});
