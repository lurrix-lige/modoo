import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../utils/database';
import { customError } from '../utils/errors';
import { successResponse, ErrorCodes } from '../utils/apiResponse';
import {
  getBenefits,
  getBenefitById,
  getBenefitByKey,
  createBenefit,
  updateBenefit,
  deleteBenefit,
  createProductBenefit,
  getProductBenefits,
  checkUserAccess,
} from '../services/BenefitService';
import {
  getPricingPlans,
  getPricingPlanById,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
} from '../services/PricingPlanService';
import {
  getActiveSubscription,
  getUserSubscriptions,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  checkSubscriptionStatus,
} from '../services/SubscriptionService';
import {
  createOrder,
  getOrderById,
  getOrderByOrderNo,
  getUserOrders,
  markOrderAsPaid,
  cancelOrder,
  refundOrder,
  getUserTransactions,
} from '../services/OrderService';

export async function membershipRoutes(fastify: FastifyInstance) {
  fastify.get('/plans', async (request, reply) => {
    const plans = await getPricingPlans();
    return successResponse(plans);
  });

  fastify.post('/plans', { preHandler: [authenticate] }, async (request, reply) => {
    const data = request.body as any;
    const plan = await createPricingPlan(data);
    reply.status(201);
    return successResponse(plan);
  });

  fastify.get('/plans/:planId', async (request, reply) => {
    const { planId } = request.params as { planId: string };
    const plan = await getPricingPlanById(planId);
    if (!plan) {
      throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '定价方案不存在', 404);
    }
    return successResponse(plan);
  });

  fastify.put('/plans/:planId', { preHandler: [authenticate] }, async (request, reply) => {
    const { planId } = request.params as { planId: string };
    const data = request.body as any;
    const result = await updatePricingPlan(planId, data);
    return successResponse(result);
  });

  fastify.delete('/plans/:planId', { preHandler: [authenticate] }, async (request, reply) => {
    const { planId } = request.params as { planId: string };
    await deletePricingPlan(planId);
    return successResponse(null);
  });

  fastify.get('/benefits', async (request, reply) => {
    const { type, scope, productType, isActive } = request.query as any;
    const benefits = await getBenefits({
      type,
      scope,
      productType,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    return successResponse(benefits);
  });

  fastify.get('/benefits/:benefitId', async (request, reply) => {
    const { benefitId } = request.params as { benefitId: string };
    const benefit = await getBenefitById(benefitId);
    if (!benefit) {
      throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '权益不存在', 404);
    }
    return successResponse(benefit);
  });

  fastify.get('/benefits/key/:benefitKey', async (request, reply) => {
    const { benefitKey } = request.params as { benefitKey: string };
    const benefit = await getBenefitByKey(benefitKey);
    if (!benefit) {
      throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '权益不存在', 404);
    }
    return successResponse(benefit);
  });

  fastify.post('/benefits', { preHandler: [authenticate] }, async (request, reply) => {
    const data = request.body as any;
    const benefit = await createBenefit(data);
    reply.status(201);
    return successResponse(benefit);
  });

  fastify.put('/benefits/:benefitId', { preHandler: [authenticate] }, async (request, reply) => {
    const { benefitId } = request.params as { benefitId: string };
    const data = request.body as any;
    const result = await updateBenefit(benefitId, data);
    return successResponse(result);
  });

  fastify.delete('/benefits/:benefitId', { preHandler: [authenticate] }, async (request, reply) => {
    const { benefitId } = request.params as { benefitId: string };
    await deleteBenefit(benefitId);
    return successResponse(null);
  });

  fastify.get('/benefits/product/:productType', async (request, reply) => {
    const { productType } = request.params as { productType: string };
    const { productId } = request.query as { productId?: string };
    const result = await getProductBenefits(productType as any, productId);
    return successResponse(result);
  });

  fastify.post('/benefits/product', { preHandler: [authenticate] }, async (request, reply) => {
    const data = request.body as any;
    const productBenefit = await createProductBenefit(data);
    reply.status(201);
    return successResponse(productBenefit);
  });

  fastify.get('/current', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const subscription = await getActiveSubscription(userId);

    if (!subscription) {
      return successResponse({ active: false, plan: null, expiresAt: null });
    }

    return successResponse({
      active: true,
      plan: subscription.plan.planKey.toLowerCase(),
      planId: subscription.planId,
      startedAt: subscription.currentPeriodStart,
      expiresAt: subscription.currentPeriodEnd,
      autoRenew: subscription.autoRenew,
    });
  });

  fastify.get('/subscriptions', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const subscriptions = await getUserSubscriptions(userId);
    return successResponse(subscriptions);
  });

  fastify.post('/subscribe', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { planId, durationDays, autoRenew, externalSubId } = request.body as any;

    const subscription = await createSubscription({
      userId,
      planId,
      durationDays,
      autoRenew,
      externalSubId,
    });

    return successResponse({
      subscription: {
        id: subscription.id,
        plan: subscription.plan.planKey.toLowerCase(),
        expiresAt: subscription.currentPeriodEnd,
      },
    });
  });

  fastify.put('/subscriptions/:subscriptionId', { preHandler: [authenticate] }, async (request, reply) => {
    const { subscriptionId } = request.params as { subscriptionId: string };
    const data = request.body as any;
    const result = await updateSubscription(subscriptionId, data);
    return successResponse(result);
  });

  fastify.post('/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const subscriptions = await getUserSubscriptions(userId);
    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');

    for (const sub of activeSubscriptions) {
      await cancelSubscription(sub.id, '用户主动取消');
    }

    return successResponse(null);
  });

  fastify.post('/orders', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { planId, quantity, promotionCode, paymentMethod, metadata } = request.body as any;

    const order = await createOrder({
      userId,
      planId,
      quantity,
      promotionCode,
      paymentMethod,
      metadata,
    });

    reply.status(201);
    return successResponse(order);
  });

  fastify.get('/orders/:orderId', { preHandler: [authenticate] }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const order = await getOrderById(orderId);
    if (!order) {
      throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '订单不存在', 404);
    }
    return successResponse(order);
  });

  fastify.get('/orders/orderNo/:orderNo', { preHandler: [authenticate] }, async (request, reply) => {
    const { orderNo } = request.params as { orderNo: string };
    const order = await getOrderByOrderNo(orderNo);
    if (!order) {
      throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '订单不存在', 404);
    }
    return successResponse(order);
  });

  fastify.get('/orders', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { status } = request.query as { status?: string };
    const orders = await getUserOrders(userId, status as any);
    return successResponse(orders);
  });

  fastify.post('/orders/:orderId/pay', { preHandler: [authenticate] }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const { transactionId, paymentMethod } = request.body as { transactionId: string; paymentMethod: string };

    const result = await markOrderAsPaid(orderId, transactionId, paymentMethod as any);
    return successResponse({ order: result });
  });

  fastify.post('/orders/:orderId/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const { reason } = request.body as { reason?: string };
    await cancelOrder(orderId, reason);
    return successResponse(null);
  });

  fastify.post('/orders/:orderId/refund', { preHandler: [authenticate] }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const { amount, reason } = request.body as { amount: number; reason?: string };
    const result = await refundOrder(orderId, amount, reason);
    return successResponse({ order: result });
  });

  fastify.get('/transactions', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { type } = request.query as { type?: string };
    const transactions = await getUserTransactions(userId, type as any);
    return successResponse(transactions);
  });

  fastify.get('/access/check', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { productType, productId } = request.query as { productType: string; productId?: string };
    
    const result = await checkUserAccess(userId, productType as any, productId);
    return successResponse(result);
  });

  fastify.get('/status', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const status = await checkSubscriptionStatus(userId);
    return successResponse(status);
  });
}