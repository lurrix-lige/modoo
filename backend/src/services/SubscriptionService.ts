import { prisma } from "../utils/database";
import { customError } from "../utils/errors";

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED' | 'PENDING';

export interface CreateSubscriptionOptions {
  userId: string;
  planId: string;
  durationDays?: number;
  autoRenew?: boolean;
  externalSubId?: string;
}

export interface UpdateSubscriptionOptions {
  status?: SubscriptionStatus;
  autoRenew?: boolean;
  cancelAtPeriodEnd?: boolean;
  terminationReason?: string;
  externalSubId?: string;
}

export async function getSubscriptionById(subscriptionId: string): Promise<any | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: true,
      benefits: { include: { benefit: true } },
      orders: true,
      transactions: true,
    },
  });

  if (!subscription) return null;

  return {
    ...subscription,
    plan: {
      ...subscription.plan,
      features: subscription.plan.features ? JSON.parse(subscription.plan.features) : null,
      notIncluded: subscription.plan.notIncluded ? JSON.parse(subscription.plan.notIncluded) : null,
      metadata: subscription.plan.metadata ? JSON.parse(subscription.plan.metadata) : null,
    },
    benefits: subscription.benefits.map(sb => ({
      ...sb,
      benefit: {
        ...sb.benefit,
        value: sb.benefit.value ? JSON.parse(sb.benefit.value) : null,
      },
      metadata: sb.metadata ? JSON.parse(sb.metadata) : null,
    })),
  };
}

export async function getActiveSubscription(userId: string): Promise<any | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      currentPeriodEnd: { gt: new Date() },
    },
    orderBy: { currentPeriodEnd: 'desc' },
    include: {
      plan: true,
      benefits: { include: { benefit: true } },
    },
  });

  if (!subscription) return null;

  return {
    ...subscription,
    plan: {
      ...subscription.plan,
      features: subscription.plan.features ? JSON.parse(subscription.plan.features) : null,
      notIncluded: subscription.plan.notIncluded ? JSON.parse(subscription.plan.notIncluded) : null,
      metadata: subscription.plan.metadata ? JSON.parse(subscription.plan.metadata) : null,
    },
    benefits: subscription.benefits.map(sb => ({
      ...sb,
      benefit: {
        ...sb.benefit,
        value: sb.benefit.value ? JSON.parse(sb.benefit.value) : null,
      },
      metadata: sb.metadata ? JSON.parse(sb.metadata) : null,
    })),
  };
}

export async function getUserSubscriptions(userId: string): Promise<any[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: true,
      benefits: { include: { benefit: true } },
    },
  });

  return subscriptions.map(subscription => ({
    ...subscription,
    plan: {
      ...subscription.plan,
      features: subscription.plan.features ? JSON.parse(subscription.plan.features) : null,
      notIncluded: subscription.plan.notIncluded ? JSON.parse(subscription.plan.notIncluded) : null,
      metadata: subscription.plan.metadata ? JSON.parse(subscription.plan.metadata) : null,
    },
    benefits: subscription.benefits.map(sb => ({
      ...sb,
      benefit: {
        ...sb.benefit,
        value: sb.benefit.value ? JSON.parse(sb.benefit.value) : null,
      },
      metadata: sb.metadata ? JSON.parse(sb.metadata) : null,
    })),
  }));
}

export async function createSubscription(options: CreateSubscriptionOptions): Promise<any> {
  const { userId, planId, durationDays, autoRenew = true, externalSubId } = options;

  const plan = await prisma.pricingPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw customError('NOT_FOUND', '定价方案不存在', 404);
  }

  const effectiveDuration = durationDays || plan.durationDays;
  const now = new Date();
  const currentPeriodStart = now;
  const currentPeriodEnd = new Date(now.getTime() + effectiveDuration * 24 * 60 * 60 * 1000);

  const benefits = await prisma.benefit.findMany({
    where: { isActive: true },
    include: { productBenefits: true },
  });

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
      autoRenew,
      externalSubId,
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

  return {
    ...subscription,
    plan: {
      ...subscription.plan,
      features: subscription.plan.features ? JSON.parse(subscription.plan.features) : null,
      notIncluded: subscription.plan.notIncluded ? JSON.parse(subscription.plan.notIncluded) : null,
      metadata: subscription.plan.metadata ? JSON.parse(subscription.plan.metadata) : null,
    },
    benefits: subscription.benefits.map(sb => ({
      ...sb,
      benefit: {
        ...sb.benefit,
        value: sb.benefit.value ? JSON.parse(sb.benefit.value) : null,
      },
    })),
  };
}

export async function updateSubscription(subscriptionId: string, options: UpdateSubscriptionOptions): Promise<any> {
  const { status, autoRenew, cancelAtPeriodEnd, terminationReason, externalSubId } = options;

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw customError('NOT_FOUND', '订阅不存在', 404);
  }

  const updateData: Record<string, any> = {};
  status && (updateData.status = status);
  autoRenew !== undefined && (updateData.autoRenew = autoRenew);
  cancelAtPeriodEnd !== undefined && (updateData.cancelAtPeriodEnd = cancelAtPeriodEnd);
  terminationReason && (updateData.terminationReason = terminationReason);
  externalSubId && (updateData.externalSubId = externalSubId);

  if (status === 'CANCELLED' && !subscription.cancelledAt) {
    updateData.cancelledAt = new Date();
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: updateData,
    include: { plan: true },
  });

  return {
    ...updated,
    plan: {
      ...updated.plan,
      features: updated.plan.features ? JSON.parse(updated.plan.features) : null,
      notIncluded: updated.plan.notIncluded ? JSON.parse(updated.plan.notIncluded) : null,
      metadata: updated.plan.metadata ? JSON.parse(updated.plan.metadata) : null,
    },
  };
}

export async function renewSubscription(subscriptionId: string): Promise<any> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  if (!subscription) {
    throw customError('NOT_FOUND', '订阅不存在', 404);
  }

  if (subscription.status !== 'ACTIVE') {
    throw customError('INVALID_STATUS', '只能续订活跃状态的订阅', 400);
  }

  const currentPeriodEnd = new Date(
    subscription.currentPeriodEnd.getTime() + subscription.plan.durationDays * 24 * 60 * 60 * 1000
  );

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      currentPeriodEnd,
      currentPeriodStart: subscription.currentPeriodEnd,
    },
    include: { plan: true, benefits: { include: { benefit: true } } },
  });

  await prisma.subscriptionBenefit.updateMany({
    where: { subscriptionId },
    data: {
      expiresAt: currentPeriodEnd,
      usageCount: 0,
    },
  });

  return {
    ...updated,
    plan: {
      ...updated.plan,
      features: updated.plan.features ? JSON.parse(updated.plan.features) : null,
      notIncluded: updated.plan.notIncluded ? JSON.parse(updated.plan.notIncluded) : null,
      metadata: updated.plan.metadata ? JSON.parse(updated.plan.metadata) : null,
    },
    benefits: updated.benefits.map(sb => ({
      ...sb,
      benefit: {
        ...sb.benefit,
        value: sb.benefit.value ? JSON.parse(sb.benefit.value) : null,
      },
    })),
  };
}

export async function cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
  await updateSubscription(subscriptionId, {
    status: 'CANCELLED',
    terminationReason: reason,
    cancelAtPeriodEnd: true,
  });
}

export async function expireSubscription(subscriptionId: string): Promise<void> {
  await updateSubscription(subscriptionId, {
    status: 'EXPIRED',
    terminationReason: '自动到期',
  });
}

export async function checkSubscriptionStatus(userId: string): Promise<{
  hasActiveSubscription: boolean;
  subscription?: any;
  expiresAt?: Date;
}> {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    return { hasActiveSubscription: false };
  }

  return {
    hasActiveSubscription: true,
    subscription,
    expiresAt: subscription.currentPeriodEnd,
  };
}

export async function incrementBenefitUsage(subscriptionId: string, benefitId: string): Promise<void> {
  const subscriptionBenefit = await prisma.subscriptionBenefit.findUnique({
    where: { subscriptionId_benefitId: { subscriptionId, benefitId } },
  });

  if (!subscriptionBenefit) {
    throw customError('NOT_FOUND', '订阅权益不存在', 404);
  }

  if (subscriptionBenefit.usageLimit !== null && subscriptionBenefit.usageCount >= subscriptionBenefit.usageLimit) {
    throw customError('LIMIT_EXCEEDED', '权益使用次数已达上限', 400);
  }

  await prisma.subscriptionBenefit.update({
    where: { subscriptionId_benefitId: { subscriptionId, benefitId } },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}

export async function getSubscriptionBenefits(subscriptionId: string): Promise<any[]> {
  const subscriptionBenefits = await prisma.subscriptionBenefit.findMany({
    where: { subscriptionId },
    include: { benefit: true },
  });

  return subscriptionBenefits.map(sb => ({
    ...sb,
    benefit: {
      ...sb.benefit,
      value: sb.benefit.value ? JSON.parse(sb.benefit.value) : null,
    },
    metadata: sb.metadata ? JSON.parse(sb.metadata) : null,
  }));
}