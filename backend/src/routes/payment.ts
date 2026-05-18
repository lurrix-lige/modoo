import { FastifyInstance } from 'fastify';
import { prisma, authenticate, AuthenticatedRequest } from '../utils/database';
import { customError } from '../utils/errors';
import { successResponse, ErrorCodes } from '../utils/apiResponse';
import { config } from '../config';
import {
  createWechatPayUnifiedOrder,
  verifyWechatPaySignature,
  applyWechatPayRefund,
  getWechatPayConfig,
} from '../services/WechatPayService';
import {
  createApplePaySession,
  verifyApplePayPayment,
  formatApplePayOrder,
  getApplePayConfig,
} from '../services/ApplePayService';
import {
  createOrder,
  getOrderById,
  getOrderByOrderNo,
  markOrderAsPaid,
  getUserOrders,
} from '../services/OrderService';
import { getPricingPlanById } from '../services/PricingPlanService';

export async function paymentRoutes(fastify: FastifyInstance) {
  fastify.post('/wechat/create-order', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { planId } = request.body as { planId: string };

    if (!planId) {
      throw customError(ErrorCodes.VALIDATION_REQUIRED_FIELD, '缺少planId参数', 400);
    }

    const plan = await getPricingPlanById(planId);
    if (!plan) {
      throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '定价方案不存在', 404);
    }

    if (!plan.isActive) {
      throw customError(ErrorCodes.BIZ_PLAN_INACTIVE, '该定价方案已停用', 400);
    }

    const order = await createOrder({
      userId,
      planId: plan.id,
      paymentMethod: 'WECHAT_PAY',
      metadata: { channel: 'wechat', planKey: plan.planKey },
    });

    const clientIp = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || (request as any).ip
      || '127.0.0.1';

    const notifyUrl = `${config.server.apiBaseUrl}/api/v1/payment/wechat/notify`;

    try {
      const payParams = await createWechatPayUnifiedOrder({
        orderId: order.orderNo,
        planName: plan.nameKey,
        amount: plan.currentPrice,
        clientIp,
        notifyUrl,
      });

      return successResponse({
        orderId: order.id,
        orderNo: order.orderNo,
        ...payParams,
      });
    } catch (error: any) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', cancelReason: `支付创建失败: ${error.message}` },
      });
      throw error;
    }
  });

  fastify.post('/wechat/notify', async (request, reply) => {
    const body = request.body as Record<string, string>;
    const { wechat } = config;

    if (!wechat.apiKey) {
      fastify.log.error('WECHAT_API_KEY not configured');
      return reply.type('application/xml').send(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统配置错误]]></return_msg></xml>'
      );
    }

    const isValid = await verifyWechatPaySignature(body, wechat.apiKey);
    if (!isValid) {
      fastify.log.warn({ body }, 'Invalid WeChat pay signature');
      return reply.type('application/xml').send(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>'
      );
    }

    const { return_code, result_code, out_trade_no, transaction_id, total_fee, time_end } = body;

    if (return_code !== 'SUCCESS') {
      fastify.log.error({ body }, 'WeChat pay failed');
      return reply.type('application/xml').send(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>'
      );
    }

    if (result_code !== 'SUCCESS') {
      fastify.log.error({ body }, 'WeChat pay result_code failed');
      return reply.type('application/xml').send(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[业务失败]]></return_msg></xml>'
      );
    }

    try {
      const order = await prisma.order.findUnique({
        where: { orderNo: out_trade_no },
        include: { items: true, transactions: true },
      });

      if (!order) {
        fastify.log.error({ out_trade_no }, 'Order not found');
        return reply.type('application/xml').send(
          '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>'
        );
      }

      if (order.status !== 'PENDING') {
        fastify.log.info({ orderId: order.id, status: order.status }, 'Order already processed');
        return reply.type('application/xml').send(
          '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
        );
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          paidAt: time_end ? new Date(time_end) : new Date(),
          transactionId: transaction_id,
          paymentMethod: 'WECHAT_PAY',
        },
      });

      const planId = order.items[0]?.planId;
      if (planId) {
        const plan = await getPricingPlanById(planId);
        if (plan) {
          const now = new Date();
          const durationDays = plan.durationDays;
          const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

          const benefits = await prisma.benefit.findMany({
            where: { isActive: true },
          });

          const subscription = await prisma.subscription.create({
            data: {
              userId: order.userId,
              planId: plan.id,
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
            data: { subscriptionId: subscription.id },
          });

          await prisma.paymentTransaction.create({
            data: {
              orderId: order.id,
              subscriptionId: subscription.id,
              userId: order.userId,
              type: 'PAYMENT',
              status: 'SUCCESS',
              amount: parseInt(total_fee, 10) / 100,
              currency: 'CNY',
              paymentMethod: 'WECHAT_PAY',
              transactionId: transaction_id,
            },
          });
        }
      }

      fastify.log.info({ orderId: order.id, transactionId: transaction_id }, 'WeChat pay success');
      return reply.type('application/xml').send(
        '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
      );
    } catch (error) {
      fastify.log.error({ error }, 'WeChat pay notify error');
      return reply.type('application/xml').send(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统错误]]></return_msg></xml>'
      );
    }
  });

  fastify.post<{ Body: { orderId: string; refundAmount: number; refundReason?: string } }>(
    '/wechat/refund',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).userId!;
      const { orderId, refundAmount, refundReason } = request.body;

      if (!orderId) {
        throw customError(ErrorCodes.VALIDATION_REQUIRED_FIELD, '缺少orderId参数', 400);
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { subscription: true },
      });

      if (!order) {
        throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '订单不存在', 404);
      }

      if (order.userId !== userId) {
        throw customError(ErrorCodes.RESOURCE_FORBIDDEN, '无权操作此订单', 403);
      }

      if (order.status === 'REFUNDED') {
        throw customError('BIZ_ORDER_REFUNDED' as any, '订单已退款', 400);
      }

      if (!order.transactionId) {
        throw customError('BIZ_REFUND_INVALID' as any, '该订单无微信交易号，无法退款', 400);
      }

      const actualRefundAmount = refundAmount || order.finalAmount;

      if (actualRefundAmount <= 0 || actualRefundAmount > order.finalAmount) {
        throw customError(ErrorCodes.VALIDATION_OUT_OF_RANGE, '退款金额无效', 400);
      }

      try {
        const refundResult = await applyWechatPayRefund({
          transactionId: order.transactionId,
          totalAmount: order.finalAmount,
          refundAmount: actualRefundAmount,
          refundReason,
        });

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'REFUNDED',
            refundAmount: actualRefundAmount,
            refundedAt: new Date(),
            refundReason,
          },
        });

        if (order.subscriptionId) {
          await prisma.subscription.update({
            where: { id: order.subscriptionId },
            data: {
              status: 'CANCELLED',
              terminationReason: 'REFUNDED',
            },
          });
        }

        await prisma.paymentTransaction.create({
          data: {
            orderId: order.id,
            subscriptionId: order.subscriptionId || null,
            userId: order.userId,
            type: 'REFUND',
            status: 'SUCCESS',
            amount: actualRefundAmount,
            currency: 'CNY',
            paymentMethod: 'WECHAT_PAY',
            transactionId: refundResult.refundId,
          },
        });

        return successResponse({
          refundId: refundResult.refundId,
          refundAmount: actualRefundAmount,
          status: refundResult.refundStatus,
        });
      } catch (error: any) {
        fastify.log.error({ error }, 'WeChat refund error');
        throw customError('REFUND_FAILED', error.message || '退款失败', 500);
      }
    }
  );

  fastify.get<{ Params: { orderId: string } }>(
    '/order/:orderId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).userId!;
      const { orderId } = request.params;

      const order = await getOrderById(orderId);

      if (!order) {
        throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '订单不存在', 404);
      }

      if (order.userId !== userId) {
        throw customError(ErrorCodes.RESOURCE_FORBIDDEN, '无权访问此订单', 403);
      }

      return successResponse(order);
    }
  );

  fastify.get<{ Querystring: { status?: string } }>(
    '/orders',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = (request as AuthenticatedRequest).userId!;
      const { status } = request.query as { status?: string };

      const orders = await getUserOrders(userId, status as any);
      return successResponse(orders);
    }
  );

  fastify.get('/config', async (request, reply) => {
    const wechatConfig = getWechatPayConfig();
    const appleConfig = getApplePayConfig();
    return successResponse({
      wechat: {
        appId: wechatConfig.appId,
        mchId: wechatConfig.mchId,
        isSandbox: wechatConfig.isSandbox,
      },
      apple: {
        merchantId: appleConfig.merchantId,
        displayName: appleConfig.displayName,
        countryCode: appleConfig.countryCode,
        currencyCode: appleConfig.currencyCode,
      },
    });
  });

  fastify.post('/apple/create-order', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { planId } = request.body as { planId: string };

    if (!planId) {
      throw customError(ErrorCodes.VALIDATION_REQUIRED_FIELD, '缺少planId参数', 400);
    }

    const plan = await getPricingPlanById(planId);
    if (!plan) {
      throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '定价方案不存在', 404);
    }

    if (!plan.isActive) {
      throw customError(ErrorCodes.BIZ_PLAN_INACTIVE, '该定价方案已停用', 400);
    }

    const order = await createOrder({
      userId,
      planId: plan.id,
      paymentMethod: 'APPLE_PAY',
      metadata: { channel: 'apple', planKey: plan.planKey },
    });

    const orderInfo = await formatApplePayOrder(order.orderNo, plan.nameKey, plan.currentPrice);

    return successResponse({
      orderId: order.id,
      orderNo: order.orderNo,
      orderInfo,
    });
  });

  fastify.post('/apple/verify-payment', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { paymentData, orderNo } = request.body as { paymentData: string; orderNo: string };

    if (!paymentData || !orderNo) {
      throw customError(ErrorCodes.VALIDATION_REQUIRED_FIELD, '缺少paymentData或orderNo参数', 400);
    }

    const order = await getOrderByOrderNo(orderNo);

    if (!order) {
      throw customError(ErrorCodes.RESOURCE_NOT_FOUND, '订单不存在', 404);
    }

    if (order.userId !== userId) {
      throw customError(ErrorCodes.RESOURCE_FORBIDDEN, '无权操作此订单', 403);
    }

    if (order.status !== 'PENDING') {
      throw customError(ErrorCodes.VALIDATION_OUT_OF_RANGE, '订单状态无效', 400);
    }

    const result = await verifyApplePayPayment({ paymentData, orderId: order.id });

    if (!result.success) {
      throw customError(ErrorCodes.VALIDATION_OUT_OF_RANGE, result.error || '支付验证失败', 400);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        transactionId: result.transactionId,
        paymentMethod: 'APPLE_PAY',
      },
    });

    const planId = order.items[0]?.planId;
    if (planId) {
      const plan = await getPricingPlanById(planId);
      if (plan) {
        const now = new Date();
        const durationDays = plan.durationDays;
        const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const benefits = await prisma.benefit.findMany({
          where: { isActive: true },
        });

        const subscription = await prisma.subscription.create({
          data: {
            userId: order.userId,
            planId: plan.id,
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
          data: { subscriptionId: subscription.id },
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
            transactionId: result.transactionId,
          },
        });
      }
    }

    return successResponse({
      orderId: order.id,
      transactionId: result.transactionId,
      status: 'completed',
    });
  });
}
