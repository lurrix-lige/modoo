import { prisma } from "../utils/database";
import { customError } from "../utils/errors";

export interface CreatePricingPlanOptions {
  planKey: string;
  nameKey: string;
  descriptionKey?: string;
  originalPrice: number;
  currentPrice: number;
  currency?: string;
  durationDays: number;
  sortOrder?: number;
  isActive?: boolean;
  isRecommended?: boolean;
  savingPercent?: number;
  features?: string[];
  notIncluded?: string[];
  metadata?: Record<string, any>;
}

export async function getPricingPlans(isActive?: boolean): Promise<any[]> {
  const where: Record<string, any> = isActive !== undefined ? { isActive } : {};

  const plans = await prisma.pricingPlan.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  return plans.map(plan => ({
    ...plan,
    features: plan.features ? JSON.parse(plan.features) : [],
    notIncluded: plan.notIncluded ? JSON.parse(plan.notIncluded) : [],
    metadata: plan.metadata ? JSON.parse(plan.metadata) : null,
  }));
}

export async function getPricingPlanById(planId: string): Promise<any | null> {
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) return null;

  return {
    ...plan,
    features: plan.features ? JSON.parse(plan.features) : [],
    notIncluded: plan.notIncluded ? JSON.parse(plan.notIncluded) : [],
    metadata: plan.metadata ? JSON.parse(plan.metadata) : null,
  };
}

export async function getPricingPlanByKey(planKey: string): Promise<any | null> {
  const plan = await prisma.pricingPlan.findUnique({
    where: { planKey },
  });

  if (!plan) return null;

  return {
    ...plan,
    features: plan.features ? JSON.parse(plan.features) : [],
    notIncluded: plan.notIncluded ? JSON.parse(plan.notIncluded) : [],
    metadata: plan.metadata ? JSON.parse(plan.metadata) : null,
  };
}

export async function createPricingPlan(options: CreatePricingPlanOptions): Promise<any> {
  const {
    planKey,
    nameKey,
    descriptionKey,
    originalPrice,
    currentPrice,
    currency = 'CNY',
    durationDays,
    sortOrder = 0,
    isActive = true,
    isRecommended = false,
    savingPercent,
    features = [],
    notIncluded = [],
    metadata,
  } = options;

  const existing = await prisma.pricingPlan.findUnique({
    where: { planKey },
  });

  if (existing) {
    throw customError('DUPLICATE_KEY', `定价方案key已存在: ${planKey}`, 400);
  }

  const plan = await prisma.pricingPlan.create({
    data: {
      planKey,
      nameKey,
      descriptionKey,
      originalPrice,
      currentPrice,
      currency,
      durationDays,
      sortOrder,
      isActive,
      isRecommended,
      savingPercent,
      features: JSON.stringify(features),
      notIncluded: JSON.stringify(notIncluded),
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });

  return {
    ...plan,
    features,
    notIncluded,
    metadata: metadata || null,
  };
}

export async function updatePricingPlan(planId: string, data: Partial<{
  nameKey: string;
  descriptionKey: string;
  originalPrice: number;
  currentPrice: number;
  currency: string;
  durationDays: number;
  sortOrder: number;
  isActive: boolean;
  isRecommended: boolean;
  savingPercent: number;
  features: string[];
  notIncluded: string[];
  metadata: Record<string, any>;
}>): Promise<any> {
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw customError('NOT_FOUND', '定价方案不存在', 404);
  }

  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'features' || key === 'notIncluded' || key === 'metadata') {
        updateData[key] = JSON.stringify(value);
      } else {
        updateData[key] = value;
      }
    }
  });

  const updated = await prisma.pricingPlan.update({
    where: { id: planId },
    data: updateData,
  });

  return {
    ...updated,
    features: updated.features ? JSON.parse(updated.features) : [],
    notIncluded: updated.notIncluded ? JSON.parse(updated.notIncluded) : [],
    metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
  };
}

export async function deletePricingPlan(planId: string): Promise<void> {
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw customError('NOT_FOUND', '定价方案不存在', 404);
  }

  const activeSubscriptions = await prisma.subscription.count({
    where: { planId, status: 'ACTIVE' },
  });

  if (activeSubscriptions > 0) {
    throw customError('INVALID_OPERATION', '该定价方案存在活跃订阅，无法删除', 400);
  }

  await prisma.orderItem.deleteMany({ where: { planId } });
  await prisma.pricingPlan.delete({ where: { id: planId } });
}