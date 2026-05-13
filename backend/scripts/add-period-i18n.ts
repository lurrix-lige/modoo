import { prisma } from './src/utils/database';

const periodTranslations = [
  // 英文翻译
  { resourceKey: 'membership.period.monthly', language: 'en', value: '/month' },
  { resourceKey: 'membership.period.quarterly', language: 'en', value: '/quarter' },
  { resourceKey: 'membership.period.yearly', language: 'en', value: '/year' },
  
  // 中文翻译
  { resourceKey: 'membership.period.monthly', language: 'zh-CN', value: '/月' },
  { resourceKey: 'membership.period.quarterly', language: 'zh-CN', value: '/季' },
  { resourceKey: 'membership.period.yearly', language: 'zh-CN', value: '/年' },
];

async function addPeriodTranslations() {
  console.log('开始添加周期相关的i18n翻译资源...');
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const translation of periodTranslations) {
    try {
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

addPeriodTranslations().catch(console.error);
