import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function flattenJson(obj: any, prefix: string = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value, newKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = `${newKey}.${index}`;
        if (typeof item === 'string') {
          result[arrayKey] = item;
        } else if (typeof item === 'object' && item !== null) {
          Object.assign(result, flattenJson(item, arrayKey));
        }
      });
    }
  }

  return result;
}

const BENEFITS = [
  {
    benefitKey: 'benefit.all_stories',
    nameKey: 'membership.benefit.allStories',
    descriptionKey: 'membership.benefit.allStoriesDesc',
    type: 'CONTENT_ACCESS',
    scope: 'SUBSCRIBERS_ONLY',
    value: JSON.stringify({ features: ['unlimited_stories', 'offline_download'] }),
    sortOrder: 1,
  },
  {
    benefitKey: 'benefit.ad_free',
    nameKey: 'membership.benefit.adFree',
    descriptionKey: 'membership.benefit.adFreeDesc',
    type: 'FEATURE',
    scope: 'SUBSCRIBERS_ONLY',
    sortOrder: 2,
  },
  {
    benefitKey: 'benefit.unlimited_breathing',
    nameKey: 'membership.benefit.unlimitedBreathing',
    descriptionKey: 'membership.benefit.unlimitedBreathingDesc',
    type: 'CONTENT_ACCESS',
    scope: 'SUBSCRIBERS_ONLY',
    sortOrder: 3,
  },
  {
    benefitKey: 'benefit.premium_support',
    nameKey: 'membership.benefit.premiumSupport',
    descriptionKey: 'membership.benefit.premiumSupportDesc',
    type: 'SERVICE',
    scope: 'SUBSCRIBERS_ONLY',
    sortOrder: 4,
  },
  {
    benefitKey: 'benefit.exclusive_content',
    nameKey: 'membership.benefit.exclusiveContent',
    descriptionKey: 'membership.benefit.exclusiveContentDesc',
    type: 'CONTENT_ACCESS',
    scope: 'PREMIUM_ONLY',
    sortOrder: 5,
  },
  {
    benefitKey: 'benefit.family_sharing',
    nameKey: 'membership.benefit.familySharing',
    descriptionKey: 'membership.benefit.familySharingDesc',
    type: 'FEATURE',
    scope: 'VIP_ONLY',
    sortOrder: 6,
  },
  {
    benefitKey: 'benefit.story_preview',
    nameKey: 'membership.benefit.storyPreview',
    descriptionKey: 'membership.benefit.storyPreviewDesc',
    type: 'CONTENT_ACCESS',
    scope: 'ALL_USERS',
    value: JSON.stringify({ previewDuration: 60 }),
    sortOrder: 10,
  },
  {
    benefitKey: 'benefit.basic_breathing',
    nameKey: 'membership.benefit.basicBreathing',
    descriptionKey: 'membership.benefit.basicBreathingDesc',
    type: 'CONTENT_ACCESS',
    scope: 'ALL_USERS',
    value: JSON.stringify({ limitCount: 3 }),
    sortOrder: 11,
  },
  {
    benefitKey: 'benefit.white_noise_basic',
    nameKey: 'membership.benefit.whiteNoiseBasic',
    descriptionKey: 'membership.benefit.whiteNoiseBasicDesc',
    type: 'CONTENT_ACCESS',
    scope: 'ALL_USERS',
    value: JSON.stringify({ limitCount: 5 }),
    sortOrder: 12,
  },
  {
    benefitKey: 'benefit.white_noise_premium',
    nameKey: 'membership.benefit.whiteNoisePremium',
    descriptionKey: 'membership.benefit.whiteNoisePremiumDesc',
    type: 'CONTENT_ACCESS',
    scope: 'SUBSCRIBERS_ONLY',
    sortOrder: 13,
  },
  {
    benefitKey: 'benefit.dialogue_access',
    nameKey: 'membership.benefit.dialogueAccess',
    descriptionKey: 'membership.benefit.dialogueAccessDesc',
    type: 'CONTENT_ACCESS',
    scope: 'SUBSCRIBERS_ONLY',
    sortOrder: 14,
  },
  {
    benefitKey: 'benefit.expert_consultation',
    nameKey: 'membership.benefit.expertConsultation',
    descriptionKey: 'membership.benefit.expertConsultationDesc',
    type: 'SERVICE',
    scope: 'PREMIUM_ONLY',
    value: JSON.stringify({ limitCount: 3 }),
    sortOrder: 15,
  },
  {
    benefitKey: 'benefit.course_access',
    nameKey: 'membership.benefit.courseAccess',
    descriptionKey: 'membership.benefit.courseAccessDesc',
    type: 'CONTENT_ACCESS',
    scope: 'SUBSCRIBERS_ONLY',
    sortOrder: 16,
  },
  {
    benefitKey: 'benefit.sleep_analysis',
    nameKey: 'membership.benefit.sleepAnalysis',
    descriptionKey: 'membership.benefit.sleepAnalysisDesc',
    type: 'FEATURE',
    scope: 'SUBSCRIBERS_ONLY',
    sortOrder: 17,
  },
  {
    benefitKey: 'benefit.checkin_reward',
    nameKey: 'membership.benefit.checkinReward',
    descriptionKey: 'membership.benefit.checkinRewardDesc',
    type: 'REWARD',
    scope: 'ALL_USERS',
    value: JSON.stringify({ pointsPerCheckin: 10 }),
    sortOrder: 18,
  },
];

const PRODUCT_BENEFITS = [
  { benefitKey: 'benefit.all_stories', productType: 'STORY', accessLevel: 'FULL' },
  { benefitKey: 'benefit.story_preview', productType: 'STORY', accessLevel: 'PREVIEW' },
  { benefitKey: 'benefit.course_access', productType: 'COURSE', accessLevel: 'FULL' },
  { benefitKey: 'benefit.course_access', productType: 'LESSON', accessLevel: 'FULL' },
  { benefitKey: 'benefit.dialogue_access', productType: 'DIALOGUE', accessLevel: 'FULL' },
  { benefitKey: 'benefit.unlimited_breathing', productType: 'BREATHING_EXERCISE', accessLevel: 'FULL' },
  { benefitKey: 'benefit.basic_breathing', productType: 'BREATHING_EXERCISE', accessLevel: 'LIMITED' },
  { benefitKey: 'benefit.white_noise_premium', productType: 'WHITE_NOISE', accessLevel: 'FULL' },
  { benefitKey: 'benefit.white_noise_basic', productType: 'WHITE_NOISE', accessLevel: 'LIMITED' },
  { benefitKey: 'benefit.expert_consultation', productType: 'EXPERT_CONSULTATION', accessLevel: 'FULL' },
  { benefitKey: 'benefit.sleep_analysis', productType: 'SLEEP_ANALYSIS', accessLevel: 'FULL' },
  { benefitKey: 'benefit.checkin_reward', productType: 'CHECK_IN_REWARD', accessLevel: 'FULL' },
  { benefitKey: 'benefit.family_sharing', productType: 'FAMILY_SHARING', accessLevel: 'FULL' },
];

const PRICING_PLANS = [
  {
    planKey: 'MONTHLY',
    nameKey: 'membership.plan.monthly',
    descriptionKey: 'membership.plan.monthlyDesc',
    originalPrice: 38,
    currentPrice: 28,
    durationDays: 30,
    sortOrder: 2,
    isActive: true,
    isRecommended: false,
    features: [
      'benefit.all_stories',
      'benefit.ad_free',
      'benefit.unlimited_breathing',
      'benefit.premium_support',
      'benefit.white_noise_basic',
      'benefit.dialogue_access',
      'benefit.course_access',
      'benefit.sleep_analysis',
    ],
    notIncluded: ['benefit.family_sharing', 'benefit.exclusive_content', 'benefit.expert_consultation', 'benefit.white_noise_premium'],
  },
  {
    planKey: 'QUARTERLY',
    nameKey: 'membership.plan.quarterly',
    descriptionKey: 'membership.plan.quarterlyDesc',
    originalPrice: 99,
    currentPrice: 68,
    durationDays: 90,
    sortOrder: 1,
    isActive: true,
    isRecommended: true,
    savingPercent: 19,
    features: [
      'benefit.all_stories',
      'benefit.ad_free',
      'benefit.unlimited_breathing',
      'benefit.premium_support',
      'benefit.exclusive_content',
      'benefit.white_noise_premium',
      'benefit.dialogue_access',
      'benefit.course_access',
      'benefit.sleep_analysis',
    ],
    notIncluded: ['benefit.family_sharing', 'benefit.expert_consultation'],
  },
  {
    planKey: 'YEARLY',
    nameKey: 'membership.plan.yearly',
    descriptionKey: 'membership.plan.yearlyDesc',
    originalPrice: 336,
    currentPrice: 198,
    durationDays: 365,
    sortOrder: 3,
    isActive: true,
    isRecommended: false,
    savingPercent: 41,
    features: [
      'benefit.all_stories',
      'benefit.ad_free',
      'benefit.unlimited_breathing',
      'benefit.premium_support',
      'benefit.exclusive_content',
      'benefit.family_sharing',
      'benefit.white_noise_premium',
      'benefit.dialogue_access',
      'benefit.course_access',
      'benefit.expert_consultation',
      'benefit.sleep_analysis',
    ],
    notIncluded: [],
  },
];

async function seedI18n() {
  console.log('Seeding i18n resources...');

  const zhCNPath = path.resolve(__dirname, '../../modoo/src/i18n/locales/zh-CN.json');
  const enPath = path.resolve(__dirname, '../../modoo/src/i18n/locales/en.json');

  if (!fs.existsSync(zhCNPath) || !fs.existsSync(enPath)) {
    console.error('i18n files not found!');
    return;
  }

  const zhCN = JSON.parse(fs.readFileSync(zhCNPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const zhCNFlatten = flattenJson(zhCN);
  const enFlatten = flattenJson(en);

  const allKeys = new Set([...Object.keys(zhCNFlatten), ...Object.keys(enFlatten)]);

  const existingResources = await prisma.i18nResource.findMany();
  const existingMap = new Map();
  existingResources.forEach(r => {
    existingMap.set(`${r.resourceKey}_${r.language}`, r);
  });

  console.log(`Found ${existingResources.length} existing i18n resources`);

  for (const key of allKeys) {
    if (zhCNFlatten[key]) {
      const uniqueKey = `${key}_zh-CN`;
      if (existingMap.has(uniqueKey)) {
        await prisma.i18nResource.update({
          where: { id: existingMap.get(uniqueKey).id },
          data: {
            value: zhCNFlatten[key],
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.i18nResource.create({
          data: {
            resourceKey: key,
            language: 'zh-CN',
            value: zhCNFlatten[key],
            type: 'TEXT',
            status: 'PUBLISHED',
            version: 1,
            author: 'system',
            lastPublished: new Date(),
          },
        });
      }
    }

    if (enFlatten[key]) {
      const uniqueKey = `${key}_en`;
      if (existingMap.has(uniqueKey)) {
        await prisma.i18nResource.update({
          where: { id: existingMap.get(uniqueKey).id },
          data: {
            value: enFlatten[key],
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.i18nResource.create({
          data: {
            resourceKey: key,
            language: 'en',
            value: enFlatten[key],
            type: 'TEXT',
            status: 'PUBLISHED',
            version: 1,
            author: 'system',
            lastPublished: new Date(),
          },
        });
      }
    }
  }

  const totalResources = await prisma.i18nResource.count();
  console.log(`Seeded i18n resources: ${totalResources} total`);
}

async function seedMembership() {
  console.log('Seeding membership data...');

  for (const benefitData of BENEFITS) {
    const existing = await prisma.benefit.findUnique({
      where: { benefitKey: benefitData.benefitKey },
    });

    if (!existing) {
      await prisma.benefit.create({
        data: benefitData,
      });
      console.log(`Created benefit: ${benefitData.benefitKey}`);
    } else {
      console.log(`Benefit already exists: ${benefitData.benefitKey}`);
    }
  }

  for (const pbData of PRODUCT_BENEFITS) {
    const benefit = await prisma.benefit.findUnique({
      where: { benefitKey: pbData.benefitKey },
    });

    if (!benefit) {
      console.log(`Skipping product benefit: ${pbData.benefitKey} - benefit not found`);
      continue;
    }

    const existing = await prisma.productBenefit.findUnique({
      where: {
        benefitId_productType_productId: {
          benefitId: benefit.id,
          productType: pbData.productType,
          productId: '',
        },
      },
    });

    if (!existing) {
      await prisma.productBenefit.create({
        data: {
          benefitId: benefit.id,
          productType: pbData.productType,
          accessLevel: pbData.accessLevel,
          isGrantByDefault: true,
        },
      });
      console.log(`Created product benefit: ${pbData.benefitKey} -> ${pbData.productType}`);
    } else {
      console.log(`Product benefit already exists: ${pbData.benefitKey} -> ${pbData.productType}`);
    }
  }

  for (const planData of PRICING_PLANS) {
    const existing = await prisma.pricingPlan.findUnique({
      where: { planKey: planData.planKey },
    });

    if (!existing) {
      await prisma.pricingPlan.create({
        data: {
          planKey: planData.planKey,
          nameKey: planData.nameKey,
          descriptionKey: planData.descriptionKey,
          originalPrice: planData.originalPrice,
          currentPrice: planData.currentPrice,
          durationDays: planData.durationDays,
          sortOrder: planData.sortOrder,
          isActive: planData.isActive,
          isRecommended: planData.isRecommended,
          savingPercent: planData.savingPercent,
          features: JSON.stringify(planData.features),
          notIncluded: JSON.stringify(planData.notIncluded),
        },
      });
      console.log(`Created pricing plan: ${planData.planKey}`);
    } else {
      console.log(`Pricing plan already exists: ${planData.planKey}`);
    }
  }

  console.log('Membership seed data initialization completed');
}

async function main() {
  console.log('Start seeding...');

  await prisma.lessonProgress.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.dialogue.deleteMany({});
  await prisma.breathingExercise.deleteMany({});
  await prisma.whiteNoise.deleteMany({});
  await prisma.expert.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.story.deleteMany({});
  await prisma.playHistory.deleteMany({});
  await prisma.guardianSpirit.deleteMany({});
  console.log('Cleared existing data');

  const stories = [
    {
      title: '勇敢的小兔子',
      titleKey: 'story.braveRabbit.title',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      audioUrl: 'http://47.94.165.219:3000/api/v1/audio/3.mp3',
      duration: 180,
      category: 'brave',
      description: '一只小兔子克服恐惧的故事',
      descriptionKey: 'story.braveRabbit.desc',
      isPremium: false,
    },
    {
      title: '美好的梦',
      titleKey: 'story.sweetDream.title',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      audioUrl: 'http://47.94.165.219:3000/api/v1/audio/4.mp3',
      duration: 240,
      category: 'dream',
      description: '关于美丽梦境的故事',
      descriptionKey: 'story.sweetDream.desc',
      isPremium: false,
    },
    {
      title: '勇气冒险',
      titleKey: 'story.braveAdventure.title',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      audioUrl: 'http://47.94.165.219:3000/api/v1/audio/2.mp3',
      duration: 200,
      category: 'brave',
      description: '勇气的冒险故事',
      descriptionKey: 'story.braveAdventure.desc',
      isPremium: false,
    },
    {
      title: '星空下的故事',
      titleKey: 'story.starNight.title',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      audioUrl: 'http://47.94.165.219:3000/api/v1/audio/1.mp3',
      duration: 220,
      category: 'dream',
      description: '关于星空的美丽故事',
      descriptionKey: 'story.starNight.desc',
      isPremium: true,
    },
    {
      title: '晚安大猩猩',
      titleKey: 'story.aopeNight.title',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      audioUrl: 'http://47.94.165.219:3000/api/v1/audio/5.mp3',
      duration: 220,
      category: 'dream',
      description: '一个勇敢的大猩猩的故事',
      descriptionKey: 'story.aopeNight.desc',
      isPremium: true,
    },
  ];

  for (const story of stories) {
    await prisma.story.create({ data: story });
  }
  console.log('Seeded Stories');

  const courses = [
    {
      id: '1',
      level: 1,
      name: '微光适应训练',
      nameKey: 'course.level1.title',
      description: '认识黑暗，了解黑暗不可怕',
      descriptionKey: 'course.level1.desc',
      imageUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      totalLessons: 10,
      completedLessons: 3,
      isUnlocked: true,
      estimatedDuration: '7天',
      difficulty: 'easy',
      isPremium: false,
    },
    {
      id: '2',
      level: 2,
      name: '勇敢者日记',
      nameKey: 'course.level2.title',
      description: '学习勇敢面对黑暗的小技巧',
      descriptionKey: 'course.level2.desc',
      imageUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      totalLessons: 10,
      completedLessons: 0,
      isUnlocked: true,
      estimatedDuration: '10天',
      difficulty: 'medium',
      isPremium: false,
    },
    {
      id: '3',
      level: 3,
      name: '想象的力量',
      nameKey: 'course.level3.title',
      description: '用想象力创造属于自己的安全空间',
      descriptionKey: 'course.level3.desc',
      imageUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      totalLessons: 10,
      completedLessons: 0,
      isUnlocked: true,
      estimatedDuration: '12天',
      difficulty: 'medium',
      isPremium: false,
    },
    {
      id: '4',
      level: 4,
      name: '黑暗中的朋友',
      nameKey: 'course.level4.title',
      description: '发现黑暗中的美好和神奇',
      descriptionKey: 'course.level4.desc',
      imageUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      totalLessons: 10,
      completedLessons: 0,
      isUnlocked: true,
      estimatedDuration: '14天',
      difficulty: 'hard',
      isPremium: false,
    },
    {
      id: '5',
      level: 5,
      name: '安睡小勇士',
      nameKey: 'course.level5.title',
      description: '成为不害怕黑暗的小勇士',
      descriptionKey: 'course.level5.desc',
      imageUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      totalLessons: 10,
      completedLessons: 0,
      isUnlocked: false,
      estimatedDuration: '21天',
      difficulty: 'hard',
      isPremium: true,
    },
  ];

  const createdCourses = [];
  for (const course of courses) {
    const created = await prisma.course.create({ data: course });
    createdCourses.push(created);
  }
  console.log('Seeded Courses');

  const lessons = [];

  lessons.push(
    { courseId: createdCourses[0].id, order: 1, title: '认识我们的眼睛', titleKey: 'course.level1.lesson1.title', description: '了解眼睛是怎么看到东西的', descriptionKey: 'course.level1.lesson1.desc', duration: 180, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/1-1.mp3', isCompleted: true },
    { courseId: createdCourses[0].id, order: 2, title: '白天和黑夜', titleKey: 'course.level1.lesson2.title', description: '了解为什么会有白天和黑夜', descriptionKey: 'course.level1.lesson2.desc', duration: 240, type: 'video', contentUrl: 'https://47.94.165.219/lessons/1-2.mp4', isCompleted: true },
    { courseId: createdCourses[0].id, order: 3, title: '黑暗里有什么', titleKey: 'course.level1.lesson3.title', description: '探索黑暗中的事物', descriptionKey: 'course.level1.lesson3.desc', duration: 300, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/1-3.mp3', isCompleted: true },
    { courseId: createdCourses[0].id, order: 4, title: '小夜灯的魔法', titleKey: 'course.level1.lesson4.title', description: '学习使用小夜灯', descriptionKey: 'course.level1.lesson4.desc', duration: 200, type: 'interactive', contentUrl: 'https://47.94.165.219/lessons/1-4.json', isCompleted: false },
    { courseId: createdCourses[0].id, order: 5, title: '安全的小角落', titleKey: 'course.level1.lesson5.title', description: '创建自己的安全角落', descriptionKey: 'course.level1.lesson5.desc', duration: 260, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/1-5.mp3', isCompleted: false },
    { courseId: createdCourses[0].id, order: 6, title: '黑暗探索小游戏', titleKey: 'course.level1.lesson6.title', description: '在黑暗中寻找宝藏', descriptionKey: 'course.level1.lesson6.desc', duration: 300, type: 'interactive', contentUrl: 'https://47.94.165.219/lessons/1-6.json', isCompleted: false },
    { courseId: createdCourses[0].id, order: 7, title: '睡前放松练习', titleKey: 'course.level1.lesson7.title', description: '学习睡前放松的小方法', descriptionKey: 'course.level1.lesson7.desc', duration: 240, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/1-7.mp3', isCompleted: false },
    { courseId: createdCourses[0].id, order: 8, title: '第一级毕业啦', titleKey: 'course.level1.lesson8.title', description: '恭喜完成第一级课程', descriptionKey: 'course.level1.lesson8.desc', duration: 180, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/1-8.mp3', isCompleted: false },
    { courseId: createdCourses[0].id, order: 9, title: '小测试', titleKey: 'course.level1.lesson9.title', description: '测试你学到了什么', descriptionKey: 'course.level1.lesson9.desc', duration: 120, type: 'interactive', contentUrl: 'https://47.94.165.219/lessons/1-9.json', isCompleted: false },
    { courseId: createdCourses[0].id, order: 10, title: '勇敢的小勋章', titleKey: 'course.level1.lesson10.title', description: '获得勇敢小勋章', descriptionKey: 'course.level1.lesson10.desc', duration: 60, type: 'video', contentUrl: 'https://47.94.165.219/lessons/1-10.mp4', isCompleted: false }
  );

  lessons.push(
    { courseId: createdCourses[1].id, order: 1, title: '勇敢的小榜样', titleKey: 'course.level2.lesson1.title', description: '认识勇敢的小榜样', descriptionKey: 'course.level2.lesson1.desc', duration: 200, type: 'video', contentUrl: 'https://47.94.165.219/lessons/2-1.mp4', isCompleted: false },
    { courseId: createdCourses[1].id, order: 2, title: '我害怕什么', titleKey: 'course.level2.lesson2.title', description: '说出你害怕的东西', descriptionKey: 'course.level2.lesson2.desc', duration: 240, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/2-2.mp3', isCompleted: false },
    { courseId: createdCourses[1].id, order: 3, title: '爸爸妈妈在身边', titleKey: 'course.level2.lesson3.title', description: '知道有人在保护你', descriptionKey: 'course.level2.lesson3.desc', duration: 180, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/2-3.mp3', isCompleted: false },
    { courseId: createdCourses[1].id, order: 4, title: '勇敢小口号', titleKey: 'course.level2.lesson4.title', description: '学习勇敢小口号', descriptionKey: 'course.level2.lesson4.desc', duration: 120, type: 'interactive', contentUrl: 'https://47.94.165.219/lessons/2-4.json', isCompleted: false },
    { courseId: createdCourses[1].id, order: 5, title: '黑暗挑战', titleKey: 'course.level2.lesson5.title', description: '第一次黑暗小挑战', descriptionKey: 'course.level2.lesson5.desc', duration: 300, type: 'interactive', contentUrl: 'https://47.94.165.219/lessons/2-5.json', isCompleted: false },
    { courseId: createdCourses[1].id, order: 6, title: '勇敢小日记', titleKey: 'course.level2.lesson6.title', description: '记录你的勇敢时刻', descriptionKey: 'course.level2.lesson6.desc', duration: 200, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/2-6.mp3', isCompleted: false },
    { courseId: createdCourses[1].id, order: 7, title: '小帮手', titleKey: 'course.level2.lesson7.title', description: '帮助其他害怕的小朋友', descriptionKey: 'course.level2.lesson7.desc', duration: 260, type: 'audio', contentUrl: 'https://47.94.165.219/lessons/2-7.mp3', isCompleted: false },
    { courseId: createdCourses[1].id, order: 8, title: '更大的挑战', titleKey: 'course.level2.lesson8.title', description: '黑暗中更久的停留', descriptionKey: 'course.level2.lesson8.desc', duration: 300, type: 'interactive', contentUrl: 'https://47.94.165.219/lessons/2-8.json', isCompleted: false },
    { courseId: createdCourses[1].id, order: 9, title: '第二级毕业', titleKey: 'course.level2.lesson9.title', description: '恭喜完成第二级', descriptionKey: 'course.level2.lesson9.desc', duration: 180, type: 'video', contentUrl: 'https://47.94.165.219/lessons/2-9.mp4', isCompleted: false },
    { courseId: createdCourses[1].id, order: 10, title: '勇敢勋章升级', titleKey: 'course.level2.lesson10.title', description: '获得更高级的勇敢勋章', descriptionKey: 'course.level2.lesson10.desc', duration: 60, type: 'video', contentUrl: 'https://47.94.165.219/lessons/2-10.mp4', isCompleted: false }
  );

  for (let c = 2; c < createdCourses.length; c++) {
    for (let i = 1; i <= 10; i++) {
      lessons.push({
        courseId: createdCourses[c].id,
        order: i,
        title: `第 ${i} 课时`,
        description: `第 ${i} 课时的内容`,
        duration: 180 + Math.floor(Math.random() * 120),
        type: ['audio', 'video', 'interactive'][Math.floor(Math.random() * 3)],
        contentUrl: `http://47.94.165.219:3000/api/v1/lessons/${c + 1}-${i}.mp3`,
        isCompleted: false
      });
    }
  }

  for (const lesson of lessons) {
    await prisma.lesson.create({ data: lesson });
  }
  console.log('Seeded Lessons');

  const breathingExercises = [
    {
      id: '1',
      nameKey: 'breathing.balanced',
      descriptionKey: 'breathing.balancedDesc',
      difficulty: 'beginner',
      phasesJson: JSON.stringify([
        { nameKey: 'breathing.inhale', duration: 4000, animationType: 'inhale' },
        { nameKey: 'breathing.hold', duration: 4000, animationType: 'hold' },
        { nameKey: 'breathing.exhale', duration: 4000, animationType: 'exhale' },
        { nameKey: 'breathing.hold', duration: 4000, animationType: 'hold' },
      ]),
      icon: 'refresh',
      color: '#6BA3D9',
      isPremium: false,
    },
    {
      id: '2',
      nameKey: 'breathing.relax',
      descriptionKey: 'breathing.relaxDesc',
      difficulty: 'beginner',
      phasesJson: JSON.stringify([
        { nameKey: 'breathing.inhale', duration: 4000, animationType: 'inhale' },
        { nameKey: 'breathing.hold', duration: 7000, animationType: 'hold' },
        { nameKey: 'breathing.exhale', duration: 8000, animationType: 'exhale' },
      ]),
      icon: 'cloud',
      color: '#7EAEC4',
      isPremium: false,
    },
    {
      id: '3',
      nameKey: 'breathing.sleep',
      descriptionKey: 'breathing.sleepDesc',
      difficulty: 'intermediate',
      phasesJson: JSON.stringify([
        { nameKey: 'breathing.inhale', duration: 6000, animationType: 'inhale' },
        { nameKey: 'breathing.hold', duration: 3000, animationType: 'hold' },
        { nameKey: 'breathing.exhale', duration: 10000, animationType: 'exhale' },
        { nameKey: 'breathing.hold', duration: 3000, animationType: 'hold' },
      ]),
      icon: 'moon',
      color: '#9D88B3',
      isPremium: true,
    },
    {
      id: '4',
      nameKey: 'breathing.energy',
      descriptionKey: 'breathing.energyDesc',
      difficulty: 'intermediate',
      phasesJson: JSON.stringify([
        { nameKey: 'breathing.inhale', duration: 3000, animationType: 'inhale' },
        { nameKey: 'breathing.exhale', duration: 3000, animationType: 'exhale' },
        { nameKey: 'breathing.inhale', duration: 3000, animationType: 'inhale' },
        { nameKey: 'breathing.exhale', duration: 5000, animationType: 'exhale' },
      ]),
      icon: 'flash',
      color: '#E8C547',
      isPremium: true,
    },
  ];

  for (const exercise of breathingExercises) {
    await prisma.breathingExercise.create({ data: exercise });
  }
  console.log('Seeded Breathing Exercises');

  const whiteNoises = [
    { id: 'rain', name: '雨声', nameKey: 'breathing.rain', icon: 'rainy', color: '#6BA3D9', category: 'nature', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', isPremium: false, duration: 1800, isLoopable: true },
    { id: 'ocean', name: '海浪声', nameKey: 'breathing.ocean', icon: 'water', color: '#7EAEC4', category: 'nature', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', isPremium: false, duration: 1800, isLoopable: true },
    { id: 'stream', name: '溪流声', nameKey: 'breathing.stream', icon: 'water-outline', color: '#8FB8CC', category: 'nature', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', isPremium: false, duration: 1800, isLoopable: true },
    { id: 'bird', name: '鸟鸣声', nameKey: 'breathing.bird', icon: 'paw', color: '#C4A763', category: 'nature', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', isPremium: false, duration: 1800, isLoopable: true },
    { id: 'forest', name: '森林声', nameKey: 'breathing.forest', icon: 'leaf', color: '#5AA76E', category: 'nature', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', isPremium: false, duration: 1800, isLoopable: true },
    { id: 'pink', name: '粉噪音', nameKey: 'breathing.pink', icon: 'heart-outline', color: '#E8A0A0', category: 'ambient', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', isPremium: false, duration: 1800, isLoopable: true },
    { id: 'fan', name: '风扇声', nameKey: 'breathing.fan', icon: 'sync', color: '#8A8A8A', category: 'ambient', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', isPremium: false, duration: 1800, isLoopable: true },
    { id: 'city', name: '城市声', nameKey: 'breathing.city', icon: 'business', color: '#6E7C92', category: 'city', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', isPremium: false, duration: 1800, isLoopable: true },
    { id: 'cafe', name: '咖啡馆', nameKey: 'breathing.cafe', icon: 'cafe', color: '#B98367', category: 'city', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', isPremium: true, duration: 1800, isLoopable: true },
  ];

  for (const noise of whiteNoises) {
    await prisma.whiteNoise.create({ data: noise });
  }
  console.log('Seeded White Noises');

  const articles = [
    {
      id: '1',
      title: '如何帮助孩子克服怕黑心理',
      titleKey: 'article.overcomeFear.title',
      categoryKey: 'knowledge.psychology',
      category: 'psychology',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      content: '这是文章的详细内容...',
      summary: '了解孩子怕黑的心理原因，以及科学的应对方法',
      summaryKey: 'article.overcomeFear.summary',
      readTime: 5,
      views: 1234,
      likes: 567,
      isFavorited: false,
      isPremium: false,
      publishDate: new Date('2026-04-20'),
      tagsJson: JSON.stringify(['怕黑', '心理', '儿童']),
      author: '梦兜团队',
    },
    {
      id: '2',
      title: '睡前仪式的重要性',
      titleKey: 'article.bedtimeRitual.title',
      categoryKey: 'knowledge.psychology',
      category: 'psychology',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      content: '这是文章的详细内容...',
      summary: '建立良好的睡前仪式，帮助孩子更好地入睡',
      summaryKey: 'article.bedtimeRitual.summary',
      readTime: 4,
      views: 892,
      likes: 345,
      isFavorited: false,
      isPremium: false,
      publishDate: new Date('2026-04-18'),
      tagsJson: JSON.stringify(['睡前', '仪式', '习惯']),
      author: '梦兜团队',
    },
    {
      id: '3',
      title: '孩子夜醒的常见原因与应对',
      titleKey: 'article.nightWakes.title',
      categoryKey: 'knowledge.psychology',
      category: 'psychology',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      content: '这是文章的详细内容...',
      summary: '分析孩子夜醒的原因，并提供实用的应对策略',
      summaryKey: 'article.nightWakes.summary',
      readTime: 6,
      views: 1567,
      likes: 789,
      isFavorited: false,
      isPremium: true,
      publishDate: new Date('2026-04-15'),
      tagsJson: JSON.stringify(['夜醒', '睡眠', '原因']),
      author: '梦兜团队',
    },
    {
      id: '4',
      title: '孩子说"妈妈我害怕"时怎么回应',
      titleKey: 'article.fearResponse.title',
      categoryKey: 'knowledge.communication',
      category: 'communication',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      content: '这是文章的详细内容...',
      summary: '用正确的方式回应孩子的恐惧，让他们感到安全',
      summaryKey: 'article.fearResponse.summary',
      readTime: 3,
      views: 2341,
      likes: 1023,
      isFavorited: false,
      isPremium: false,
      publishDate: new Date('2026-04-12'),
      tagsJson: JSON.stringify(['害怕', '回应', '沟通']),
      author: '梦兜团队',
    },
    {
      id: '5',
      title: '家长常见的5个错误做法',
      titleKey: 'article.parentMistakes.title',
      categoryKey: 'knowledge.pitfalls',
      category: 'pitfalls',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      content: '这是文章的详细内容...',
      summary: '避开这些常见的错误，更好地帮助孩子克服恐惧',
      summaryKey: 'article.parentMistakes.summary',
      readTime: 4,
      views: 1893,
      likes: 678,
      isFavorited: false,
      isPremium: true,
      publishDate: new Date('2026-04-10'),
      tagsJson: JSON.stringify(['错误', '家长', '做法']),
      author: '梦兜团队',
    },
    {
      id: '6',
      title: '如何选择合适的小夜灯',
      titleKey: 'article.nightLight.title',
      categoryKey: 'knowledge.psychology',
      category: 'psychology',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      content: '这是文章的详细内容...',
      summary: '小夜灯的选择原则和推荐',
      summaryKey: 'article.nightLight.summary',
      readTime: 3,
      views: 1123,
      likes: 456,
      isFavorited: false,
      publishDate: new Date('2026-04-08'),
      tagsJson: JSON.stringify(['小夜灯', '选择', '产品']),
      author: '梦兜团队',
    },
    {
      id: '7',
      title: '循序渐进的脱敏训练法',
      titleKey: 'article.desensitization.title',
      categoryKey: 'knowledge.psychology',
      category: 'psychology',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      content: '这是文章的详细内容...',
      summary: '科学的脱敏训练方法，帮助孩子逐步适应黑暗',
      summaryKey: 'article.desensitization.summary',
      readTime: 7,
      views: 2012,
      likes: 890,
      isFavorited: false,
      publishDate: new Date('2026-04-05'),
      tagsJson: JSON.stringify(['脱敏', '训练', '方法']),
      author: '梦兜团队',
    },
    {
      id: '8',
      title: '营造安全的睡眠环境',
      titleKey: 'article.sleepEnvironment.title',
      categoryKey: 'knowledge.psychology',
      category: 'psychology',
      coverUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      content: '这是文章的详细内容...',
      summary: '如何为孩子创造一个安全、舒适的睡眠环境',
      summaryKey: 'article.sleepEnvironment.summary',
      readTime: 4,
      views: 1567,
      likes: 678,
      isFavorited: false,
      publishDate: new Date('2026-04-03'),
      tagsJson: JSON.stringify(['环境', '安全', '睡眠']),
      author: '梦兜团队',
    },
  ];

  for (const article of articles) {
    await prisma.article.create({ data: article });
  }
  console.log('Seeded Articles');

  const dialogues = [
    {
      id: '1',
      titleKey: 'dialogue.title1',
      scenarioKey: 'dialogue.scenario1',
      responseKey: 'dialogue.response1',
      title: '害怕黑暗时的回应',
      scenario: '妈妈，我怕黑！',
      response: '宝贝，有妈妈在这儿呢，我们一起看看窗外的星星',
      category: 'fear',
      tagsJson: JSON.stringify(['害怕', '回应', '安慰']),
      isPremium: false,
      useCount: 123,
      createdAt: new Date('2026-01-15'),
    },
    {
      id: '2',
      titleKey: 'dialogue.title2',
      scenarioKey: 'dialogue.scenario2',
      responseKey: 'dialogue.response2',
      title: '做噩梦后的安抚',
      scenario: '我做了一个噩梦...',
      response: '来，告诉妈妈你梦到了什么？那只是梦而已',
      category: 'nightmare',
      tagsJson: JSON.stringify(['噩梦', '安抚', '噩梦后']),
      isPremium: false,
      useCount: 87,
      createdAt: new Date('2026-01-16'),
    },
    {
      id: '3',
      titleKey: 'dialogue.title3',
      scenarioKey: 'dialogue.scenario3',
      responseKey: 'dialogue.response3',
      category: 'sleep',
      tagsJson: JSON.stringify(['睡前', '安全感', '入睡']),
      isPremium: false,
      useCount: 102,
      createdAt: new Date('2026-01-17'),
    },
    {
      id: '4',
      titleKey: 'dialogue.title4',
      scenarioKey: 'dialogue.scenario4',
      responseKey: 'dialogue.response4',
      category: 'discipline',
      tagsJson: JSON.stringify(['拒绝', '温和', '坚定']),
      isPremium: false,
      useCount: 76,
      createdAt: new Date('2026-01-18'),
    },
    {
      id: '5',
      titleKey: 'dialogue.title5',
      scenarioKey: 'dialogue.scenario5',
      responseKey: 'dialogue.response5',
      category: 'fear',
      tagsJson: JSON.stringify(['害怕', '探索', '鼓励']),
      isPremium: false,
      useCount: 95,
      createdAt: new Date('2026-01-19'),
    },
    {
      id: '6',
      titleKey: 'dialogue.title6',
      scenarioKey: 'dialogue.scenario6',
      responseKey: 'dialogue.response6',
      category: 'emotion',
      tagsJson: JSON.stringify(['生气', '情绪', '平静']),
      isPremium: false,
      useCount: 68,
      createdAt: new Date('2026-01-20'),
    },
    {
      id: '7',
      titleKey: 'dialogue.title7',
      scenarioKey: 'dialogue.scenario7',
      responseKey: 'dialogue.response7',
      category: 'sleep',
      tagsJson: JSON.stringify(['不想睡觉', '哄睡', '故事']),
      isPremium: false,
      useCount: 112,
      createdAt: new Date('2026-01-21'),
    },
    {
      id: '8',
      titleKey: 'dialogue.title8',
      scenarioKey: 'dialogue.scenario8',
      responseKey: 'dialogue.response8',
      category: 'emotion',
      tagsJson: JSON.stringify(['分离焦虑', '上学', '安慰']),
      isPremium: false,
      useCount: 81,
      createdAt: new Date('2026-01-22'),
    },
  ];

  for (const dialogue of dialogues) {
    await prisma.dialogue.create({ data: dialogue });
  }
  console.log('Seeded Dialogues');

  const guardianSpirits = [
    {
      id: 'moon',
      nameKey: 'home.moonGuardian',
      descriptionKey: 'home.moonGuardianDesc',
      icon: 'moon',
      color: '#7EAEC4',
      type: 'MOON',
      isDefault: true,
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 'firefly',
      nameKey: 'home.fireflyGuardian',
      descriptionKey: 'home.fireflyGuardianDesc',
      icon: 'flash',
      color: '#E8C547',
      type: 'FIREFLY',
      isDefault: false,
      sortOrder: 2,
      isActive: true,
    },
    {
      id: 'star',
      nameKey: 'home.starGuardian',
      descriptionKey: 'home.starGuardianDesc',
      icon: 'star',
      color: '#B4A7D6',
      type: 'STAR',
      isDefault: false,
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (const spirit of guardianSpirits) {
    await prisma.guardianSpirit.create({ data: spirit });
  }
  console.log('Seeded Guardian Spirits');

  const experts = [
    {
      id: '1',
      nameKey: 'consultation.expert1',
      titleKey: 'consultation.expert1Title',
      avatarUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      hospitalKey: 'consultation.expert1Hospital',
      specialtyKeysJson: JSON.stringify(['consultation.expert1Spec1', 'consultation.expert1Spec2']),
      experience: 15,
      consultationPrice: 299,
      rating: 4.9,
      reviewCount: 328,
      availableTimesJson: JSON.stringify(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']),
    },
    {
      id: '2',
      nameKey: 'consultation.expert2',
      titleKey: 'consultation.expert2Title',
      avatarUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      hospitalKey: 'consultation.expert2Hospital',
      specialtyKeysJson: JSON.stringify(['consultation.expert2Spec1', 'consultation.expert2Spec2']),
      experience: 12,
      consultationPrice: 249,
      rating: 4.8,
      reviewCount: 245,
      availableTimesJson: JSON.stringify(['09:30', '10:30', '11:30', '14:30', '15:30', '16:30']),
    },
    {
      id: '3',
      nameKey: 'consultation.expert3',
      titleKey: 'consultation.expert3Title',
      avatarUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      hospitalKey: 'consultation.expert3Hospital',
      specialtyKeysJson: JSON.stringify(['consultation.expert3Spec1', 'consultation.expert3Spec2']),
      experience: 18,
      consultationPrice: 349,
      rating: 4.95,
      reviewCount: 512,
      availableTimesJson: JSON.stringify(['10:00', '11:00', '15:00', '16:00', '17:00']),
    },
    {
      id: '4',
      nameKey: 'consultation.expert4',
      titleKey: 'consultation.expert4Title',
      avatarUrl: 'http://47.94.165.219:3000/api/v1/images/logo.png',
      hospitalKey: 'consultation.expert4Hospital',
      specialtyKeysJson: JSON.stringify(['consultation.expert4Spec1', 'consultation.expert4Spec2']),
      experience: 10,
      consultationPrice: 199,
      rating: 4.7,
      reviewCount: 156,
      availableTimesJson: JSON.stringify(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']),
    },
  ];

  for (const expert of experts) {
    await prisma.expert.create({ data: expert });
  }
  console.log('Seeded Experts');

  await seedMembership();
  await seedI18n();

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });