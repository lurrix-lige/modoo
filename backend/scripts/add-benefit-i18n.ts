import { prisma } from './src/utils/database';

const benefitTranslations = [
  // 英文翻译
  { resourceKey: 'benefit.all_stories', language: 'en', value: 'All Stories' },
  { resourceKey: 'benefit.ad_free', language: 'en', value: 'Ad Free' },
  { resourceKey: 'benefit.unlimited_breathing', language: 'en', value: 'Unlimited Breathing' },
  { resourceKey: 'benefit.premium_support', language: 'en', value: 'Premium Support' },
  { resourceKey: 'benefit.exclusive_content', language: 'en', value: 'Exclusive Content' },
  { resourceKey: 'benefit.white_noise_premium', language: 'en', value: 'Premium White Noise' },
  { resourceKey: 'benefit.white_noise_basic', language: 'en', value: 'Basic White Noise' },
  { resourceKey: 'benefit.dialogue_access', language: 'en', value: 'Dialogue Access' },
  { resourceKey: 'benefit.course_access', language: 'en', value: 'Course Access' },
  { resourceKey: 'benefit.sleep_analysis', language: 'en', value: 'Sleep Analysis' },
  
  // 中文翻译
  { resourceKey: 'benefit.all_stories', language: 'zh-CN', value: '全部故事' },
  { resourceKey: 'benefit.ad_free', language: 'zh-CN', value: '无广告' },
  { resourceKey: 'benefit.unlimited_breathing', language: 'zh-CN', value: '无限呼吸练习' },
  { resourceKey: 'benefit.premium_support', language: 'zh-CN', value: '高级支持' },
  { resourceKey: 'benefit.exclusive_content', language: 'zh-CN', value: '独家内容' },
  { resourceKey: 'benefit.white_noise_premium', language: 'zh-CN', value: '高级白噪音' },
  { resourceKey: 'benefit.white_noise_basic', language: 'zh-CN', value: '基础白噪音' },
  { resourceKey: 'benefit.dialogue_access', language: 'zh-CN', value: '对话访问' },
  { resourceKey: 'benefit.course_access', language: 'zh-CN', value: '课程访问' },
  { resourceKey: 'benefit.sleep_analysis', language: 'zh-CN', value: '睡眠分析' },
];

async function addBenefitTranslations() {
  console.log('开始添加benefit相关的i18n翻译资源...');
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const translation of benefitTranslations) {
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

addBenefitTranslations().catch(console.error);
