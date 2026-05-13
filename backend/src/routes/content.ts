import { FastifyInstance } from 'fastify';
import { prisma, optionalAuth, AuthenticatedRequest, getChildId } from '../utils/database';
import { customError } from '../utils/errors';
import { requireMembership } from '../middleware/authorization';

interface ContentItem {
  id: string;
  type: 'story' | 'breathing' | 'course' | 'article';
  title: string;
  description: string;
  duration?: number;
  isPremium: boolean;
  priority: number;
  coverUrl?: string;
  icon?: string;
}

interface RecommendationResult {
  featuredContent: ContentItem[];
  categoryContent: Map<string, ContentItem[]>;
}

export async function contentRoutes(fastify: FastifyInstance) {
  fastify.get('/recommendations', { preHandler: optionalAuth }, async (request, reply) => {
    const isPaid = (request as AuthenticatedRequest).userId 
      ? await checkUserPaid(request as AuthenticatedRequest)
      : false;

    const [stories, courses, exercises, articles] = await Promise.all([
      prisma.story.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.findMany({
        take: 10,
        orderBy: { level: 'asc' },
      }),
      prisma.breathingExercise.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.article.findMany({
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
        description: story.description || '温馨睡前童话',
        duration: story.duration,
        isPremium: false,
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
        description: course.description,
        duration: course.totalLessons * 300,
        isPremium: false,
        priority: 100 + index + 1,
        coverUrl: course.imageUrl,
        icon: 'school',
      });
    });

    exercises.forEach((exercise, index) => {
      contentItems.push({
        id: exercise.id,
        type: 'breathing',
        title: exercise.nameKey,
        description: exercise.descriptionKey || '放松身心助眠',
        duration: JSON.parse(exercise.phasesJson).reduce((acc: number, phase: any) => acc + phase.duration, 0),
        isPremium: false,
        priority: 200 + index + 1,
        icon: 'leaf',
      });
    });

    articles.forEach((article, index) => {
      contentItems.push({
        id: article.id,
        type: 'article',
        title: article.title,
        description: article.summary,
        duration: article.readTime * 60,
        isPremium: false,
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
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.findMany({
        take: 5,
        orderBy: { level: 'asc' },
      }),
      prisma.breathingExercise.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.article.findMany({
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
