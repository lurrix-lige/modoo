import { prisma } from './src/utils/database';

async function queryMembershipPlans() {
  console.log('查询会员计划...');
  
  const plans = await prisma.membershipPlan.findMany({
    include: {
      benefits: true,
    },
  });
  
  console.log(`找到 ${plans.length} 个会员计划:`);
  
  plans.forEach(plan => {
    console.log(`\n计划ID: ${plan.id}`);
    console.log(`名称: ${plan.name}`);
    console.log(`描述: ${plan.description}`);
    console.log(`价格: ¥${plan.price}`);
    console.log(`周期: ${plan.period}`);
    console.log(`权益数量: ${plan.benefits.length}`);
    plan.benefits.forEach(b => console.log(`  - ${b.benefitKey}`));
  });
  
  await prisma.$disconnect();
}

queryMembershipPlans().catch(console.error);
