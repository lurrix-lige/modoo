import { prisma } from './src/utils/database';

const membershipTranslations = [
  // 英文翻译 - 使用 planKey
  { resourceKey: 'membership.plan.monthly', language: 'en', value: 'Monthly Plan' },
  { resourceKey: 'membership.plan.monthlyDesc', language: 'en', value: 'Access all premium features for one month' },
  { resourceKey: 'membership.plan.quarterly', language: 'en', value: 'Quarterly Plan' },
  { resourceKey: 'membership.plan.quarterlyDesc', language: 'en', value: 'Best value - save 25%' },
  { resourceKey: 'membership.plan.yearly', language: 'en', value: 'Yearly Plan' },
  { resourceKey: 'membership.plan.yearlyDesc', language: 'en', value: 'Great savings - save 40%' },
  
  // 中文翻译 - 使用 planKey
  { resourceKey: 'membership.plan.monthly', language: 'zh-CN', value: '月度会员' },
  { resourceKey: 'membership.plan.monthlyDesc', language: 'zh-CN', value: '畅享所有高级功能一个月' },
  { resourceKey: 'membership.plan.quarterly', language: 'zh-CN', value: '季度会员' },
  { resourceKey: 'membership.plan.quarterlyDesc', language: 'zh-CN', value: '最优惠 - 节省25%' },
  { resourceKey: 'membership.plan.yearly', language: 'zh-CN', value: '年度会员' },
  { resourceKey: 'membership.plan.yearlyDesc', language: 'zh-CN', value: '超值优惠 - 节省40%' },
  
  // 临时修复：使用计划ID作为key（前端可能使用了ID而不是nameKey）
  // 月度会员 ID: a533445c-77ce-41b1-9918-ff0def65712f
  { resourceKey: 'membership.plan.a533445c-77ce-41b1-9918-ff0def65712f', language: 'zh-CN', value: '月度会员' },
  // 季度会员 ID: a7fdef1d-7fe9-49af-bb9b-3bb55bc9dfd8
  { resourceKey: 'membership.plan.a7fdef1d-7fe9-49af-bb9b-3bb55bc9dfd8', language: 'zh-CN', value: '季度会员' },
  // 年度会员 ID: b5711a9a-6f7c-48fa-9774-4a731c9a8b6a
  { resourceKey: 'membership.plan.b5711a9a-6f7c-48fa-9774-4a731c9a8b6a', language: 'zh-CN', value: '年度会员' },
];

async function addMembershipTranslations() {
  console.log('开始添加会员计划相关的i18n翻译资源...');
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const translation of membershipTranslations) {
    try {
      // 检查是否已存在
      const existing = await prisma.i18nResource.findUnique({
        where: { 
          resourceKey_language: { 
            resourceKey: translation.resourceKey, 
            language: translation.language 
          } 
        },
      });
      
      if (existing) {
        console.log(`已存在: [${translation.language}] ${translation.resourceKey}`);
        skippedCount++;
        continue;
      }
      
      // 创建新的翻译资源
      await prisma.i18nResource.create({
        data: {
          ...translation,
          type: 'TEXT',
          status: 'PUBLISHED',
          version: 1,
        },
      });
      
      console.log(`已添加: [${translation.language}] ${translation.resourceKey} = "${translation.value}"`);
      addedCount++;
    } catch (error) {
      console.error(`添加失败 [${translation.language}] ${translation.resourceKey}:`, error);
    }
  }
  
  console.log(`\n完成！添加了 ${addedCount} 条新翻译，跳过了 ${skippedCount} 条已存在的翻译`);
  
  await prisma.$disconnect();
}

addMembershipTranslations().catch(console.error);
