import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/database', () => ({
  prisma: {
    pricingPlan: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    orderItem: {
      deleteMany: vi.fn(),
    },
    subscription: {
      count: vi.fn(),
    },
  },
}));

vi.mock('../../utils/errors', () => {
  const actual = vi.importActual('../../utils/errors');
  return actual;
});

import { prisma } from '../../utils/database';
import {
  getPricingPlans,
  getPricingPlanById,
  getPricingPlanByKey,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
} from '../PricingPlanService';

const mockPlan = {
  id: 'plan-1',
  planKey: 'monthly',
  nameKey: 'plan.monthly.name',
  descriptionKey: 'plan.monthly.desc',
  originalPrice: 39.99,
  currentPrice: 29.99,
  currency: 'CNY',
  durationDays: 30,
  sortOrder: 1,
  isActive: true,
  isRecommended: true,
  savingPercent: 25,
  features: JSON.stringify(['高清音频', '无限故事']),
  notIncluded: JSON.stringify(['一对一咨询']),
  metadata: JSON.stringify({ badge: 'popular' }),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PricingPlanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPricingPlans', () => {
    it('should return parsed plans with features as array', async () => {
      vi.mocked(prisma.pricingPlan.findMany).mockResolvedValue([mockPlan as any]);

      const plans = await getPricingPlans();

      expect(plans).toHaveLength(1);
      expect(Array.isArray(plans[0].features)).toBe(true);
      expect(plans[0].features).toEqual(['高清音频', '无限故事']);
      expect(Array.isArray(plans[0].notIncluded)).toBe(true);
      expect(plans[0].notIncluded).toEqual(['一对一咨询']);
      expect(plans[0].metadata).toEqual({ badge: 'popular' });
    });

    it('should handle empty features gracefully', async () => {
      vi.mocked(prisma.pricingPlan.findMany).mockResolvedValue([
        { ...mockPlan, features: null, notIncluded: null, metadata: null } as any,
      ]);

      const plans = await getPricingPlans();

      expect(plans[0].features).toEqual([]);
      expect(plans[0].notIncluded).toEqual([]);
      expect(plans[0].metadata).toBeNull();
    });

    it('should filter by active status when specified', async () => {
      vi.mocked(prisma.pricingPlan.findMany).mockResolvedValue([mockPlan as any]);

      await getPricingPlans(true);

      expect(prisma.pricingPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should return all plans when no filter', async () => {
      vi.mocked(prisma.pricingPlan.findMany).mockResolvedValue([mockPlan as any]);

      await getPricingPlans();

      expect(prisma.pricingPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });
  });

  describe('getPricingPlanById', () => {
    it('should return null when plan is not found', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(null);

      const result = await getPricingPlanById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return parsed plan', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);

      const result = await getPricingPlanById('plan-1');
      expect(result).not.toBeNull();
      expect(result!.planKey).toBe('monthly');
      expect(result!.features).toEqual(['高清音频', '无限故事']);
    });
  });

  describe('getPricingPlanByKey', () => {
    it('should return null when plan key is not found', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(null);

      const result = await getPricingPlanByKey('nonexistent');
      expect(result).toBeNull();
    });

    it('should find plan by key', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);

      const result = await getPricingPlanByKey('monthly');
      expect(result).not.toBeNull();
      expect(result!.planKey).toBe('monthly');
    });
  });

  describe('createPricingPlan', () => {
    it('should throw error when plan key already exists', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);

      await expect(
        createPricingPlan({
          planKey: 'monthly',
          nameKey: 'plan.monthly.name',
          originalPrice: 39.99,
          currentPrice: 29.99,
          durationDays: 30,
        })
      ).rejects.toThrow('定价方案key已存在');
    });

    it('should create a new pricing plan', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.pricingPlan.create).mockResolvedValue(mockPlan as any);

      const result = await createPricingPlan({
        planKey: 'yearly',
        nameKey: 'plan.yearly.name',
        originalPrice: 399,
        currentPrice: 299,
        durationDays: 365,
        features: ['全部功能'],
        notIncluded: [],
      });

      expect(prisma.pricingPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            planKey: 'yearly',
            features: JSON.stringify(['全部功能']),
            notIncluded: JSON.stringify([]),
          }),
        })
      );
      expect(result.planKey).toBe('monthly');
    });
  });

  describe('updatePricingPlan', () => {
    it('should throw error when plan is not found', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(null);

      await expect(
        updatePricingPlan('nonexistent', { currentPrice: 19.99 })
      ).rejects.toThrow('定价方案不存在');
    });

    it('should update plan fields correctly', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.pricingPlan.update).mockResolvedValue({
        ...mockPlan,
        currentPrice: 19.99,
      } as any);

      const result = await updatePricingPlan('plan-1', {
        currentPrice: 19.99,
        features: ['更新功能'],
      });

      expect(prisma.pricingPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentPrice: 19.99,
            features: JSON.stringify(['更新功能']),
          }),
        })
      );
    });
  });

  describe('deletePricingPlan', () => {
    it('should throw error when plan is not found', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(null);

      await expect(deletePricingPlan('nonexistent')).rejects.toThrow('定价方案不存在');
    });

    it('should throw error when active subscriptions exist', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.subscription.count).mockResolvedValue(5);

      await expect(deletePricingPlan('plan-1')).rejects.toThrow('存在活跃订阅');
    });

    it('should delete plan and associated order items', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(mockPlan as any);
      vi.mocked(prisma.subscription.count).mockResolvedValue(0);
      vi.mocked(prisma.orderItem.deleteMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.pricingPlan.delete).mockResolvedValue(mockPlan as any);

      await deletePricingPlan('plan-1');

      expect(prisma.orderItem.deleteMany).toHaveBeenCalledWith({ where: { planId: 'plan-1' } });
      expect(prisma.pricingPlan.delete).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
    });
  });
});
