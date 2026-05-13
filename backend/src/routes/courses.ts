import { FastifyInstance } from 'fastify';
import { prisma, optionalAuth, AuthenticatedRequest, getChildId } from '../utils/database';
import { customError } from '../utils/errors';

export async function courseRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: optionalAuth }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as {
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        skip,
        take: limit,
        orderBy: { level: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            take: 1,
          },
        },
      }),
      prisma.course.count(),
    ]);

    let userProgress: Map<string, { completedLessons: number }> = new Map();

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    if (userId && childId) {
      try {
        const progress = await prisma.lessonProgress.findMany({
          where: { childId, isCompleted: true },
          include: { lesson: true },
        });
        const courseProgress = new Map<string, { completedLessons: number }>();
        progress.forEach((p: { lesson: { courseId: string } }) => {
          const courseId = p.lesson.courseId;
          courseProgress.set(courseId, { completedLessons: (courseProgress.get(courseId)?.completedLessons || 0) + 1 });
        });
        userProgress = courseProgress;
      } catch {
        // Ignore if no child profile
      }
    } else if (anonymousId) {
      try {
        const progress = await prisma.lessonProgress.findMany({
          where: { anonymousId, isCompleted: true },
          include: { lesson: true },
        });
        const courseProgress = new Map<string, { completedLessons: number }>();
        progress.forEach((p: { lesson: { courseId: string } }) => {
          const courseId = p.lesson.courseId;
          courseProgress.set(courseId, { completedLessons: (courseProgress.get(courseId)?.completedLessons || 0) + 1 });
        });
        userProgress = courseProgress;
      } catch {
        // Ignore errors
      }
    }

    return {
      success: true,
      data: {
        courses: courses.map((c: { id: string }) => ({
          ...c,
          completedLessons: userProgress.get(c.id)?.completedLessons || 0,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/:id', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      throw customError('NOT_FOUND', '课程不存在', 404);
    }

    let completedLessonIds: Set<string> = new Set();

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    if (userId && childId) {
      try {
        const progress = await prisma.lessonProgress.findMany({
          where: { childId, isCompleted: true },
        });
        completedLessonIds = new Set(progress.map((p: { lessonId: string }) => p.lessonId));
      } catch {
        // Ignore if no child profile
      }
    } else if (anonymousId) {
      try {
        const progress = await prisma.lessonProgress.findMany({
          where: { anonymousId, isCompleted: true },
        });
        completedLessonIds = new Set(progress.map((p: { lessonId: string }) => p.lessonId));
      } catch {
        // Ignore errors
      }
    }

    return {
      success: true,
      data: {
        ...course,
        lessons: course.lessons.map((l: { id: string }) => ({
          ...l,
          isCompleted: completedLessonIds.has(l.id),
        })),
        completedLessons: course.lessons.filter((l: { id: string }) => completedLessonIds.has(l.id)).length,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/lessons/:lessonId/complete', { preHandler: optionalAuth }, async (request, reply) => {
    const { lessonId } = request.params as { lessonId: string };
    
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw customError('NOT_FOUND', '课时不存在', 404);
    }

    let progress;
    
    if (userId && childId) {
      progress = await prisma.lessonProgress.upsert({
        where: { childId_lessonId: { childId, lessonId } },
        update: { isCompleted: true, completedAt: new Date() },
        create: {
          userId,
          childId,
          lessonId,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    } else if (anonymousId) {
      const existing = await prisma.lessonProgress.findFirst({
        where: { anonymousId, lessonId },
      });
      
      if (existing) {
        progress = await prisma.lessonProgress.update({
          where: { id: existing.id },
          data: { isCompleted: true, completedAt: new Date() },
        });
      } else {
        progress = await prisma.lessonProgress.create({
          data: {
            anonymousId,
            lessonId,
            isCompleted: true,
            completedAt: new Date(),
          },
        });
      }
    } else {
      throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
    }

    return {
      success: true,
      data: progress,
      timestamp: new Date().toISOString(),
    };
  });
}
