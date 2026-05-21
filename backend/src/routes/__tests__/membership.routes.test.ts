import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import Fastify from 'fastify';

vi.mock('../../config', () => ({
  config: {
    jwt: { secret: 'test-secret' },
    server: { env: 'test', apiBaseUrl: 'http://localhost:3000' },
    verification: { expiryMinutes: 5, maxAttempts: 5, maxVerifyAttempts: 3, rateLimitWindowMs: 60000, enableRealSms: false },
  },
}));

vi.mock('../../services/PricingPlanService', () => ({
  getPricingPlans: vi.fn(),
  getPricingPlanById: vi.fn(),
  createPricingPlan: vi.fn(),
  updatePricingPlan: vi.fn(),
  deletePricingPlan: vi.fn(),
}));

vi.mock('../../services/BenefitService', () => ({
  getBenefits: vi.fn(),
  getBenefitById: vi.fn(),
  getBenefitByKey: vi.fn(),
  createBenefit: vi.fn(),
  updateBenefit: vi.fn(),
  deleteBenefit: vi.fn(),
  createProductBenefit: vi.fn(),
  getProductBenefits: vi.fn(),
  checkUserAccess: vi.fn(),
}));

vi.mock('../../services/SubscriptionService', () => ({
  getActiveSubscription: vi.fn(),
  getUserSubscriptions: vi.fn(),
  createSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  checkSubscriptionStatus: vi.fn(),
}));

vi.mock('../../services/OrderService', () => ({
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  getOrderByOrderNo: vi.fn(),
  getUserOrders: vi.fn(),
  markOrderAsPaid: vi.fn(),
  cancelOrder: vi.fn(),
  refundOrder: vi.fn(),
  getUserTransactions: vi.fn(),
}));

vi.mock('../../utils/errors', () => {
  const actual = vi.importActual('../../utils/errors');
  return actual;
});

vi.mock('../../utils/database', () => ({
  prisma: {},
  authenticate: vi.fn(async (request: any) => { request.userId = 'user-1'; }),
  AuthenticatedRequest: {} as any,
}));

import { membershipRoutes } from '../../routes/membership';
import { getPricingPlans, getPricingPlanById, createPricingPlan, deletePricingPlan } from '../../services/PricingPlanService';
import { getActiveSubscription, checkSubscriptionStatus } from '../../services/SubscriptionService';
import { authenticate } from '../../utils/database';

async function buildApp() {
  const app = Fastify({ logger: false });

  await app.register((await import('@fastify/jwt')).default || (await import('@fastify/jwt')), {
    secret: 'test-secret',
  });

  app.setErrorHandler((error: any, request: any, reply: any) => {
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal Server Error',
      },
      timestamp: new Date().toISOString(),
    });
  });

  await app.register(membershipRoutes, { prefix: '/membership' });

  return app;
}

describe('Membership Routes Integration', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset authenticate to default (success)
    vi.mocked(authenticate).mockImplementation(async (request: any) => {
      request.userId = 'user-1';
    });
  });

  describe('GET /membership/plans', () => {
    it('should return pricing plans list', async () => {
      vi.mocked(getPricingPlans).mockResolvedValue([
        { id: 'plan-1', planKey: 'monthly', currentPrice: 29.99, features: ['高清音频'] },
      ] as any);

      const res = await app.inject({
        method: 'GET',
        url: '/membership/plans',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].planKey).toBe('monthly');
    });
  });

  describe('GET /membership/plans/:planId', () => {
    it('should return plan by ID', async () => {
      vi.mocked(getPricingPlanById).mockResolvedValue({
        id: 'plan-1', planKey: 'monthly', currentPrice: 29.99,
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/membership/plans/plan-1',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('plan-1');
    });

    it('should return 404 when plan not found', async () => {
      vi.mocked(getPricingPlanById).mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/membership/plans/nonexistent',
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /membership/plans (authenticated)', () => {
    it('should create a pricing plan', async () => {
      vi.mocked(createPricingPlan).mockResolvedValue({
        id: 'new-plan', planKey: 'yearly',
      } as any);

      const res = await app.inject({
        method: 'POST',
        url: '/membership/plans',
        payload: { planKey: 'yearly', currentPrice: 299, durationDays: 365 },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation(async () => {
        const err: any = new Error('未授权');
        err.statusCode = 401;
        throw err;
      });

      const res = await app.inject({
        method: 'POST',
        url: '/membership/plans',
        payload: { planKey: 'yearly', currentPrice: 299 },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /membership/plans/:planId (authenticated)', () => {
    it('should delete a plan', async () => {
      vi.mocked(deletePricingPlan).mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'DELETE',
        url: '/membership/plans/plan-1',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeNull();
    });
  });

  describe('GET /membership/current (authenticated)', () => {
    it('should return active subscription', async () => {
      vi.mocked(getActiveSubscription).mockResolvedValue({
        id: 'sub-1',
        planId: 'plan-1',
        plan: { planKey: 'MONTHLY', id: 'plan-1' },
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        autoRenew: true,
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/membership/current',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.active).toBe(true);
      expect(body.data.plan).toBe('monthly');
    });

    it('should return inactive when no subscription', async () => {
      vi.mocked(getActiveSubscription).mockResolvedValue(null);

      const res = await app.inject({
        method: 'GET',
        url: '/membership/current',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.active).toBe(false);
    });
  });

  describe('GET /membership/status (authenticated)', () => {
    it('should return subscription status', async () => {
      vi.mocked(checkSubscriptionStatus).mockResolvedValue({
        isActive: true,
        plan: 'monthly',
        expiresAt: new Date().toISOString(),
      } as any);

      const res = await app.inject({
        method: 'GET',
        url: '/membership/status',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
    });
  });
});
