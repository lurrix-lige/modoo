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
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    orderItem: {
      deleteMany: vi.fn(),
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
    },
  },
}));

vi.mock('../../utils/errors', () => {
  const actual = vi.importActual('../../utils/errors');
  return actual;
});

import { prisma } from '../../utils/database';
import {
  createApplePaySession,
  formatApplePayOrder,
  getApplePayConfig,
} from '../ApplePayService';

describe('ApplePayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getApplePayConfig', () => {
    it('should return Apple Pay configuration with all required fields', () => {
      const cfg = getApplePayConfig();

      expect(cfg).toHaveProperty('merchantIdentifier');
      expect(cfg).toHaveProperty('merchantId');
      expect(cfg).toHaveProperty('countryCode');
      expect(cfg).toHaveProperty('currencyCode');
      expect(cfg).toHaveProperty('displayName');
      expect(cfg).toHaveProperty('supportedNetworks');
      expect(cfg).toHaveProperty('merchantCapabilities');
      expect(Array.isArray(cfg.supportedNetworks)).toBe(true);
      expect(Array.isArray(cfg.merchantCapabilities)).toBe(true);
    });
  });

  describe('formatApplePayOrder', () => {
    it('should format order data for Apple Pay', async () => {
      const result = await formatApplePayOrder('ORD-TEST-001', 'Monthly Plan', 29.99);

      expect(result).toMatchObject({
        countryCode: expect.any(String),
        currencyCode: expect.any(String),
        merchantIdentifier: expect.any(String),
        total: {
          label: 'Monthly Plan',
          amount: '29.99',
          type: 'final',
        },
        lineItems: [
          {
            label: 'Monthly Plan',
            amount: '29.99',
          },
        ],
        metadata: {
          orderId: 'ORD-TEST-001',
        },
      });
    });

    it('should format zero amounts correctly', async () => {
      const result = await formatApplePayOrder('FREE-001', 'Free Plan', 0);

      expect(result.total.amount).toBe('0.00');
      expect(result.lineItems[0].amount).toBe('0.00');
    });

    it('should round amount to 2 decimal places', async () => {
      const result = await formatApplePayOrder('ORD-002', 'Plan', 9.999);

      expect(result.total.amount).toBe('10.00');
    });
  });

  describe('createApplePaySession', () => {
    it('should throw error when pricing plan is not found', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue(null);

      await expect(
        createApplePaySession({ planId: 'nonexistent', userId: 'user-1' })
      ).rejects.toThrow('会员计划不存在');
    });

    it('should create an order and return session data', async () => {
      vi.mocked(prisma.pricingPlan.findUnique).mockResolvedValue({
        id: 'plan-1',
        planKey: 'monthly',
        nameKey: 'plan.monthly.name',
        currentPrice: 29.99,
        durationDays: 30,
      } as any);

      vi.mocked(prisma.order.create).mockResolvedValue({
        id: 'order-1',
        orderNo: 'APL-TEST001',
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
          },
        ],
      } as any);

      const result = await createApplePaySession({ planId: 'plan-1', userId: 'user-1' });

      expect(result).toMatchObject({
        orderId: 'order-1',
        orderNo: expect.stringMatching(/^APL/),
        countryCode: expect.any(String),
        currencyCode: expect.any(String),
        total: {
          amount: '29.99',
          type: 'final',
        },
        supportedNetworks: expect.any(Array),
        merchantCapabilities: expect.any(Array),
        metadata: {
          orderId: expect.any(String),
        },
      });
    });
  });
});
