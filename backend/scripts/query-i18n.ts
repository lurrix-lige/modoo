import { prisma } from './src/utils/database';

async function queryI18nResources() {
  console.log('查询i18n资源...');
  
  const count = await prisma.i18nResource.count();
  console.log(`总共有 ${count} 条i18n资源`);
  
  const resources = await prisma.i18nResource.findMany({
    take: 30,
    orderBy: { resourceKey: 'asc' },
  });
  
  console.log('\n前30条资源:');
  resources.forEach(r => {
    console.log(`[${r.language}] ${r.resourceKey} = "${r.value}" (${r.status})`);
  });
  
  // 检查是否存在benefit相关的翻译
  const benefitKeys = await prisma.i18nResource.findMany({
    where: {
      resourceKey: {
        startsWith: 'benefit.',
      },
    },
  });
  
  console.log(`\n找到 ${benefitKeys.length} 个 benefit 相关的翻译:`);
  benefitKeys.forEach(r => {
    console.log(`[${r.language}] ${r.resourceKey} = "${r.value}"`);
  });
  
  await prisma.$disconnect();
}

queryI18nResources().catch(console.error);
