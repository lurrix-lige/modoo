import { FastifyInstance } from 'fastify';
import { prisma, optionalAuth, AuthenticatedRequest } from '../utils/database';

interface ContentItem {
  id: string;
  type: 'story' | 'breathing' | 'course' | 'article';
  title: string;
  titleKey?: string | null;
  description: string;
  descriptionKey?: string | null;
  duration?: number;
  isPremium: boolean;
  priority: number;
  coverUrl?: string;
  icon?: string;
}

export async function contentRoutes(fastify: FastifyInstance) {
  fastify.get('/recommendations', { preHandler: optionalAuth }, async (request, reply) => {
    // Pre-load user payment status for access control
    await (request as AuthenticatedRequest).userId
      ? checkUserPaid(request as AuthenticatedRequest)
      : Promise.resolve(false);

    const [stories, courses, exercises, articles] = await Promise.all([
      prisma.story.findMany({
        where: { deletedAt: null },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.findMany({
        where: { deletedAt: null },
        take: 10,
        orderBy: { level: 'asc' },
      }),
      prisma.breathingExercise.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.article.findMany({
        where: { deletedAt: null },
        take: 10,
        orderBy: { views: 'desc' },
      }),
    ]);

    const contentItems: ContentItem[] = [];

    stories.forEach((story, index) => {
      contentItems.push({
        id: story.id,
        type: 'story',
        title: story.title,
        titleKey: story.titleKey,
        description: story.description || '温馨睡前童话',
        descriptionKey: story.descriptionKey,
        duration: story.duration,
        isPremium: story.isPremium,
        priority: index + 1,
        coverUrl: story.coverUrl,
        icon: 'book',
      });
    });

    courses.forEach((course, index) => {
      contentItems.push({
        id: course.id,
        type: 'course',
        title: course.name,
        titleKey: course.nameKey,
        description: course.description,
        descriptionKey: course.descriptionKey,
        duration: course.totalLessons * 300,
        isPremium: course.isPremium,
        priority: 100 + index + 1,
        coverUrl: course.imageUrl,
        icon: 'school',
      });
    });

    exercises.forEach((exercise, index) => {
      let duration = 0;
      try {
        const phases = JSON.parse(exercise.phasesJson);
        duration = phases.reduce((acc: number, phase: any) => acc + phase.duration, 0);
      } catch {
        duration = 0;
      }
      contentItems.push({
        id: exercise.id,
        type: 'breathing',
        title: '', // 呼吸练习没有直接的标题值，依赖国际化
        titleKey: exercise.nameKey,
        description: '', // 呼吸练习没有直接的描述值，依赖国际化
        descriptionKey: exercise.descriptionKey,
        duration,
        isPremium: exercise.isPremium,
        priority: 200 + index + 1,
        icon: 'leaf',
      });
    });

    articles.forEach((article, index) => {
      contentItems.push({
        id: article.id,
        type: 'article',
        title: article.title,
        titleKey: article.titleKey,
        description: article.summary,
        descriptionKey: article.summaryKey,
        duration: article.readTime * 60,
        isPremium: article.isPremium,
        priority: 300 + index + 1,
        coverUrl: article.coverUrl || undefined,
        icon: 'document-text',
      });
    });

    const sortedContent = contentItems.sort((a, b) => a.priority - b.priority);

    const featuredContent = sortedContent.slice(0, 4);

    const categoryContent = new Map<string, ContentItem[]>();
    const categories = ['story', 'breathing', 'course', 'article'];

    categories.forEach((category) => {
      const items = sortedContent
        .filter((item) => item.type === category)
        .slice(0, 3);
      if (items.length > 0) {
        categoryContent.set(category, items);
      }
    });

    return {
      success: true,
      data: {
        featuredContent,
        categoryContent: Object.fromEntries(categoryContent),
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/free', async (request, reply) => {
    const [stories, courses, exercises, articles] = await Promise.all([
      prisma.story.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { level: 'asc' },
      }),
      prisma.breathingExercise.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.article.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { views: 'desc' },
      }),
    ]);

    return {
      success: true,
      data: {
        stories,
        courses,
        exercises,
        articles,
      },
      timestamp: new Date().toISOString(),
    };
  });
}

async function checkUserPaid(request: AuthenticatedRequest): Promise<boolean> {
  if (!request.userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      include: { subscriptions: { where: { status: 'ACTIVE', currentPeriodEnd: { gt: new Date() } } } },
    });
    return !!user?.subscriptions.find(s => s.status === 'ACTIVE');
  } catch {
    return false;
  }
}
