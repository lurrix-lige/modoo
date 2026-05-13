import { prisma } from './src/utils/database';

async function queryPricingPlans() {
  console.log('查询定价计划...');
  
  const plans = await prisma.pricingPlan.findMany({
    include: {
      orderItems: true,
    },
  });
  
  console.log(`找到 ${plans.length} 个定价计划:`);
  
  plans.forEach(plan => {
    console.log(`\n计划ID: ${plan.id}`);
    console.log(`planKey: ${plan.planKey}`);
    console.log(`nameKey: ${plan.nameKey}`);
    console.log(`descriptionKey: ${plan.descriptionKey}`);
    console.log(`价格: ¥${plan.currentPrice}`);
    console.log(`周期: ${plan.durationDays}天`);
    console.log(`是否推荐: ${plan.isRecommended}`);
  });
  
  await prisma.$disconnect();
}

queryPricingPlans().catch(console.error);
