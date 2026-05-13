import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/database';
import { expireSubscription } from './SubscriptionService';
import { expirePendingOrders } from './OrderService';
import { logger } from '../utils/logger';

export async function registerCronJobs(fastify: FastifyInstance) {
  const ONE_MINUTE = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MINUTE;

  fastify.log.info('Registering cron jobs...');

  setInterval(async () => {
    try {
      await processExpiredSubscriptions();
    } catch (error) {
      fastify.log.error({ err: error }, 'Error processing expired subscriptions');
    }
  }, ONE_HOUR);

  setInterval(async () => {
    try {
      await processExpiredOrders();
    } catch (error) {
      fastify.log.error({ err: error }, 'Error processing expired orders');
    }
  }, ONE_HOUR);

  fastify.addHook('onReady', async () => {
    fastify.log.info('Running initial cron job checks...');
    await processExpiredSubscriptions();
    await processExpiredOrders();
  });
}

async function processExpiredSubscriptions(): Promise<void> {
  const now = new Date();

  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      currentPeriodEnd: { lt: now },
    },
  });

  if (expiredSubscriptions.length > 0) {
    logger.info(`Found ${expiredSubscriptions.length} expired subscriptions to process`);
  }

  for (const subscription of expiredSubscriptions) {
    try {
      await expireSubscription(subscription.id);
      logger.info(`Expired subscription ${subscription.id} for user ${subscription.userId}`);
    } catch (error) {
      logger.error(`Failed to expire subscription ${subscription.id}`, { error });
    }
  }
}

async function processExpiredOrders(): Promise<void> {
  const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expiredOrders = await prisma.order.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: expiryTime },
    },
    data: {
      status: 'EXPIRED',
      expiredAt: new Date(),
    },
  });

  if (expiredOrders.count > 0) {
    logger.info(`Expired ${expiredOrders.count} pending orders`);
  }
}

export { processExpiredSubscriptions, processExpiredOrders };
