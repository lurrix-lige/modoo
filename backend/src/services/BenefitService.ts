import { prisma } from "../utils/database";
import { customError } from "../utils/errors";

export type ProductType = 
  | 'STORY' 
  | 'COURSE' 
  | 'LESSON' 
  | 'DIALOGUE' 
  | 'BREATHING_EXERCISE' 
  | 'WHITE_NOISE' 
  | 'EXPERT_CONSULTATION' 
  | 'ARTICLE' 
  | 'CHECK_IN_REWARD' 
  | 'SLEEP_ANALYSIS' 
  | 'CUSTOM_PLAN' 
  | 'FAMILY_SHARING';

export type BenefitType = 'CONTENT_ACCESS' | 'FEATURE' | 'SERVICE' | 'REWARD';

export type AccessScope = 'ALL_USERS' | 'SUBSCRIBERS_ONLY' | 'PREMIUM_ONLY' | 'VIP_ONLY' | 'TRIAL_USERS';

export type AccessLevel = 'FULL' | 'LIMITED' | 'PREVIEW';

export interface BenefitValue {
  maxViews?: number;
  maxDownloads?: number;
  durationDays?: number;
  features?: string[];
}

export interface GetBenefitsOptions {
  type?: BenefitType;
  scope?: AccessScope;
  productType?: ProductType;
  isActive?: boolean;
}

export async function getBenefits(options: GetBenefitsOptions = {}): Promise<any[]> {
  const { type, scope, productType, isActive = true } = options;
  
  const where: Record<string, any> = { isActive };
  
  type && (where.type = type);
  scope && (where.scope = scope);
  
  const benefits = await prisma.benefit.findMany({
    where,
    include: {
      productBenefits: productType ? { where: { productType } } : true,
    },
    orderBy: { sortOrder: 'asc' },
  });

  return benefits.map(benefit => ({
    ...benefit,
    value: benefit.value ? JSON.parse(benefit.value) : null,
  }));
}

export async function getBenefitById(benefitId: string): Promise<any | null> {
  const benefit = await prisma.benefit.findUnique({
    where: { id: benefitId },
    include: { productBenefits: true },
  });

  return benefit ? {
    ...benefit,
    value: benefit.value ? JSON.parse(benefit.value) : null,
  } : null;
}

export async function getBenefitByKey(benefitKey: string): Promise<any | null> {
  const benefit = await prisma.benefit.findUnique({
    where: { benefitKey },
    include: { productBenefits: true },
  });

  return benefit ? {
    ...benefit,
    value: benefit.value ? JSON.parse(benefit.value) : null,
  } : null;
}

export async function createBenefit(data: {
  benefitKey: string;
  nameKey: string;
  descriptionKey?: string;
  type: BenefitType;
  scope?: AccessScope;
  value?: BenefitValue;
  isStackable?: boolean;
  sortOrder?: number;
}): Promise<any> {
  const existing = await prisma.benefit.findUnique({
    where: { benefitKey: data.benefitKey },
  });

  if (existing) {
    throw customError('DUPLICATE_KEY', `权益key已存在: ${data.benefitKey}`, 400);
  }

  const benefit = await prisma.benefit.create({
    data: {
      benefitKey: data.benefitKey,
      nameKey: data.nameKey,
      descriptionKey: data.descriptionKey,
      type: data.type,
      scope: data.scope || 'ALL_USERS',
      value: data.value ? JSON.stringify(data.value) : undefined,
      isStackable: data.isStackable || false,
      sortOrder: data.sortOrder || 0,
    },
  });

  return {
    ...benefit,
    value: data.value || null,
  };
}

export async function updateBenefit(benefitId: string, data: Partial<{
  nameKey: string;
  descriptionKey: string;
  type: BenefitType;
  scope: AccessScope;
  value: BenefitValue;
  isStackable: boolean;
  sortOrder: number;
  isActive: boolean;
}>): Promise<any> {
  const benefit = await prisma.benefit.findUnique({
    where: { id: benefitId },
  });

  if (!benefit) {
    throw customError('NOT_FOUND', '权益不存在', 404);
  }

  const updateData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = key === 'value' ? JSON.stringify(value) : value;
    }
  });

  const updated = await prisma.benefit.update({
    where: { id: benefitId },
    data: updateData,
  });

  return {
    ...updated,
    value: updated.value ? JSON.parse(updated.value) : null,
  };
}

export async function deleteBenefit(benefitId: string): Promise<void> {
  const benefit = await prisma.benefit.findUnique({
    where: { id: benefitId },
  });

  if (!benefit) {
    throw customError('NOT_FOUND', '权益不存在', 404);
  }

  await prisma.productBenefit.deleteMany({ where: { benefitId } });
  await prisma.subscriptionBenefit.deleteMany({ where: { benefitId } });
  await prisma.benefit.delete({ where: { id: benefitId } });
}

export async function getProductBenefits(
  productType: ProductType,
  productId?: string
): Promise<any[]> {
  const where: Record<string, any> = { productType };
  productId && (where.productId = productId);

  const productBenefits = await prisma.productBenefit.findMany({
    where,
    include: { benefit: true },
    orderBy: { accessLevel: 'asc' },
  });

  return productBenefits.map(pb => ({
    ...pb,
    benefit: {
      ...pb.benefit,
      value: pb.benefit.value ? JSON.parse(pb.benefit.value) : null,
    },
    conditions: pb.conditions ? JSON.parse(pb.conditions) : null,
  }));
}

export async function createProductBenefit(data: {
  benefitId: string;
  productType: ProductType;
  productId?: string;
  accessLevel?: AccessLevel;
  limitQuantity?: number;
  limitPeriod?: string;
  isGrantByDefault?: boolean;
  conditions?: Record<string, any>;
}): Promise<any> {
  const existing = await prisma.productBenefit.findUnique({
    where: {
      benefitId_productType_productId: {
        benefitId: data.benefitId,
        productType: data.productType,
        productId: data.productId || '',
      },
    },
  });

  if (existing) {
    throw customError('DUPLICATE_KEY', '该权益与产品的关联已存在', 400);
  }

  return prisma.productBenefit.create({
    data: {
      benefitId: data.benefitId,
      productType: data.productType,
      productId: data.productId,
      accessLevel: data.accessLevel || 'FULL',
      limitQuantity: data.limitQuantity,
      limitPeriod: data.limitPeriod,
      isGrantByDefault: data.isGrantByDefault || true,
      conditions: data.conditions ? JSON.stringify(data.conditions) : undefined,
    },
  });
}

export async function deleteProductBenefit(productBenefitId: string): Promise<void> {
  await prisma.productBenefit.delete({ where: { id: productBenefitId } });
}

export async function checkUserAccess(
  userId: string,
  productType: ProductType,
  productId?: string
): Promise<{ hasAccess: boolean; accessLevel: AccessLevel; benefit?: any }> {
  const productBenefits = await getProductBenefits(productType, productId);
  
  const userSubscriptions = await prisma.subscription.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      currentPeriodEnd: { gt: new Date() },
    },
    include: { benefits: { include: { benefit: true } } },
  });

  const userBenefitKeys = new Set<string>();
  userSubscriptions.forEach(sub => {
    sub.benefits.forEach(sb => {
      userBenefitKeys.add(sb.benefit.benefitKey);
    });
  });

  const activeBenefits = await getBenefits({ scope: 'ALL_USERS', isActive: true });
  activeBenefits.forEach(b => userBenefitKeys.add(b.benefitKey));

  for (const pb of productBenefits) {
    if (userBenefitKeys.has(pb.benefit.benefitKey)) {
      return {
        hasAccess: true,
        accessLevel: pb.accessLevel as AccessLevel,
        benefit: pb.benefit,
      };
    }
  }

  return { hasAccess: false, accessLevel: 'PREVIEW' };
}

export async function getBenefitsBySubscription(subscriptionId: string): Promise<any[]> {
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