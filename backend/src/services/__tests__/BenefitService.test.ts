import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/database', () => ({
  prisma: {
    benefit: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productBenefit: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    subscriptionBenefit: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../utils/errors', () => {
  const actual = vi.importActual('../../utils/errors');
  return actual;
});

import { prisma } from '../../utils/database';
import {
  getBenefits,
  getBenefitById,
  getBenefitByKey,
  createBenefit,
  updateBenefit,
  deleteBenefit,
  getProductBenefits,
  createProductBenefit,
  deleteProductBenefit,
  checkUserAccess,
  getBenefitsBySubscription,
} from '../BenefitService';

const mockBenefit = {
  id: 'ben-1',
  benefitKey: 'hd_audio',
  nameKey: 'benefit.hd_audio.name',
  descriptionKey: 'benefit.hd_audio.desc',
  type: 'FEATURE',
  scope: 'SUBSCRIBERS_ONLY',
  value: JSON.stringify({ maxViews: 100, features: ['无损音质'] }),
  validFrom: new Date('2025-01-01'),
  validTo: null,
  isStackable: true,
  isActive: true,
  sortOrder: 1,
  productBenefits: [],
};

const mockProductBenefit = {
  id: 'pb-1',
  benefitId: 'ben-1',
  productType: 'STORY',
  productId: 'story-1',
  accessLevel: 'FULL',
  limitQuantity: 10,
  limitPeriod: 'monthly',
  isGrantByDefault: true,
  conditions: JSON.stringify({ region: 'CN' }),
  benefit: { ...mockBenefit, value: JSON.stringify({ maxViews: 100, features: ['无损音质'] }) },
};

describe('BenefitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBenefits', () => {
    it('should return parsed benefits list', async () => {
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([mockBenefit as any]);

      const results = await getBenefits();

      expect(results).toHaveLength(1);
      expect(results[0].value).toEqual({ maxViews: 100, features: ['无损音质'] });
      expect(prisma.benefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should filter by type when specified', async () => {
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([]);

      await getBenefits({ type: 'SERVICE' });

      expect(prisma.benefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, type: 'SERVICE' },
        })
      );
    });

    it('should filter by scope and productType', async () => {
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([]);

      await getBenefits({ scope: 'ALL_USERS', productType: 'STORY' });

      expect(prisma.benefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, scope: 'ALL_USERS' },
          include: { productBenefits: { where: { productType: 'STORY' } } },
        })
      );
    });

    it('should handle null benefit value', async () => {
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([
        { ...mockBenefit, value: null } as any,
      ]);

      const results = await getBenefits();
      expect(results[0].value).toBeNull();
    });
  });

  describe('getBenefitById', () => {
    it('should return null when not found', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(null);

      const result = await getBenefitById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return parsed benefit', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(mockBenefit as any);

      const result = await getBenefitById('ben-1');
      expect(result).not.toBeNull();
      expect(result!.benefitKey).toBe('hd_audio');
      expect(result!.value).toEqual({ maxViews: 100, features: ['无损音质'] });
    });
  });

  describe('getBenefitByKey', () => {
    it('should return null when key not found', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(null);

      const result = await getBenefitByKey('nonexistent');
      expect(result).toBeNull();
    });

    it('should find by benefitKey', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(mockBenefit as any);

      const result = await getBenefitByKey('hd_audio');
      expect(result!.benefitKey).toBe('hd_audio');
      expect(prisma.benefit.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { benefitKey: 'hd_audio' } })
      );
    });
  });

  describe('createBenefit', () => {
    it('should throw error when benefitKey already exists', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(mockBenefit as any);

      await expect(
        createBenefit({
          benefitKey: 'hd_audio',
          nameKey: 'test',
          type: 'FEATURE',
        })
      ).rejects.toThrow('权益key已存在');
    });

    it('should create a benefit with default values', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.benefit.create).mockResolvedValue(mockBenefit as any);

      const result = await createBenefit({
        benefitKey: 'new_benefit',
        nameKey: 'benefit.new.name',
        type: 'FEATURE',
        value: { maxViews: 50 },
      });

      expect(prisma.benefit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          benefitKey: 'new_benefit',
          type: 'FEATURE',
          scope: 'ALL_USERS',
          value: JSON.stringify({ maxViews: 50 }),
          isStackable: false,
          sortOrder: 0,
        }),
      });
      expect(result.benefitKey).toBe('hd_audio');
    });
  });

  describe('updateBenefit', () => {
    it('should throw error when benefit not found', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(null);

      await expect(
        updateBenefit('nonexistent', { nameKey: 'new' })
      ).rejects.toThrow('权益不存在');
    });

    it('should update benefit and serialize value', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(mockBenefit as any);
      vi.mocked(prisma.benefit.update).mockResolvedValue({
        ...mockBenefit,
        nameKey: 'updated',
        value: JSON.stringify({ maxViews: 200 }),
      } as any);

      const result = await updateBenefit('ben-1', {
        nameKey: 'updated',
        value: { maxViews: 200 },
        isActive: false,
      });

      expect(prisma.benefit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ben-1' },
          data: expect.objectContaining({
            nameKey: 'updated',
            value: JSON.stringify({ maxViews: 200 }),
            isActive: false,
          }),
        })
      );
      expect(result.value).toEqual({ maxViews: 200 });
    });
  });

  describe('deleteBenefit', () => {
    it('should throw error when benefit not found', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(null);

      await expect(deleteBenefit('nonexistent')).rejects.toThrow('权益不存在');
    });

    it('should delete benefit and related records', async () => {
      vi.mocked(prisma.benefit.findUnique).mockResolvedValue(mockBenefit as any);
      vi.mocked(prisma.productBenefit.deleteMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.subscriptionBenefit.deleteMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.benefit.delete).mockResolvedValue(mockBenefit as any);

      await deleteBenefit('ben-1');

      expect(prisma.productBenefit.deleteMany).toHaveBeenCalledWith({ where: { benefitId: 'ben-1' } });
      expect(prisma.subscriptionBenefit.deleteMany).toHaveBeenCalledWith({ where: { benefitId: 'ben-1' } });
      expect(prisma.benefit.delete).toHaveBeenCalledWith({ where: { id: 'ben-1' } });
    });
  });

  describe('getProductBenefits', () => {
    it('should return parsed product benefits', async () => {
      vi.mocked(prisma.productBenefit.findMany).mockResolvedValue([mockProductBenefit as any]);

      const results = await getProductBenefits('STORY', 'story-1');

      expect(prisma.productBenefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productType: 'STORY', productId: 'story-1' },
        })
      );
      expect(results[0].benefit.value).toEqual({ maxViews: 100, features: ['无损音质'] });
      expect(results[0].conditions).toEqual({ region: 'CN' });
    });

    it('should work without productId', async () => {
      vi.mocked(prisma.productBenefit.findMany).mockResolvedValue([]);

      await getProductBenefits('STORY');

      expect(prisma.productBenefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productType: 'STORY' },
        })
      );
    });
  });

  describe('createProductBenefit', () => {
    it('should throw error when relation already exists', async () => {
      vi.mocked(prisma.productBenefit.findUnique).mockResolvedValue({ id: 'existing' } as any);

      await expect(
        createProductBenefit({
          benefitId: 'ben-1',
          productType: 'STORY',
          productId: 'story-1',
        })
      ).rejects.toThrow('该权益与产品的关联已存在');
    });

    it('should create product benefit relation', async () => {
      vi.mocked(prisma.productBenefit.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productBenefit.create).mockResolvedValue(mockProductBenefit as any);

      const result = await createProductBenefit({
        benefitId: 'ben-1',
        productType: 'STORY',
        productId: 'story-1',
        conditions: { region: 'CN' },
      });

      expect(prisma.productBenefit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          benefitId: 'ben-1',
          productType: 'STORY',
          productId: 'story-1',
          accessLevel: 'FULL',
          isGrantByDefault: true,
          conditions: JSON.stringify({ region: 'CN' }),
        }),
      });
    });
  });

  describe('deleteProductBenefit', () => {
    it('should delete product benefit by id', async () => {
      vi.mocked(prisma.productBenefit.delete).mockResolvedValue({} as any);

      await deleteProductBenefit('pb-1');

      expect(prisma.productBenefit.delete).toHaveBeenCalledWith({ where: { id: 'pb-1' } });
    });
  });

  describe('checkUserAccess', () => {
    it('should deny access when no matching benefit', async () => {
      vi.mocked(prisma.productBenefit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([]);
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([]);

      const result = await checkUserAccess('user-1', 'STORY', 'story-1');
      expect(result.hasAccess).toBe(false);
      expect(result.accessLevel).toBe('PREVIEW');
    });

    it('should grant access when user has benefit via subscription', async () => {
      vi.mocked(prisma.productBenefit.findMany).mockResolvedValue([{
        ...mockProductBenefit,
        benefit: { ...mockBenefit, benefitKey: 'hd_audio' },
        accessLevel: 'FULL',
      }] as any);
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([{
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
        benefits: [{ benefit: { benefitKey: 'hd_audio' } }],
      }] as any);
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([]);

      const result = await checkUserAccess('user-1', 'STORY', 'story-1');
      expect(result.hasAccess).toBe(true);
      expect(result.accessLevel).toBe('FULL');
      expect(result.benefit.benefitKey).toBe('hd_audio');
    });

    it('should grant access when benefit scope is ALL_USERS', async () => {
      vi.mocked(prisma.productBenefit.findMany).mockResolvedValue([{
        ...mockProductBenefit,
        benefit: { ...mockBenefit, benefitKey: 'free_feature' },
        accessLevel: 'LIMITED',
      }] as any);
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([]);
      vi.mocked(prisma.benefit.findMany).mockResolvedValue([{
        ...mockBenefit,
        benefitKey: 'free_feature',
        value: null,
      }] as any);

      const result = await checkUserAccess('user-1', 'STORY', 'story-1');
      expect(result.hasAccess).toBe(true);
      expect(result.accessLevel).toBe('LIMITED');
    });
  });

  describe('getBenefitsBySubscription', () => {
    it('should return parsed subscription benefits', async () => {
      vi.mocked(prisma.subscriptionBenefit.findMany).mockResolvedValue([
        {
          benefitId: 'ben-1',
          benefit: { id: 'ben-1', benefitKey: 'hd_audio', value: '{"maxViews":100}' },
          usageCount: 5,
          usageLimit: 100,
          metadata: null,
        },
      ] as any);

      const results = await getBenefitsBySubscription('sub-1');
      expect(results).toHaveLength(1);
      expect(results[0].benefit.value).toEqual({ maxViews: 100 });
      expect(prisma.subscriptionBenefit.findMany).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-1' },
        include: { benefit: true },
      });
    });
  });
});
