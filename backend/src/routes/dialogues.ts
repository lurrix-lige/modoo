import { FastifyInstance } from 'fastify';
import { prisma, optionalAuth, AuthenticatedRequest, getChildId } from '../utils/database';
import { customError } from '../utils/errors';
import { logger } from '../utils/logger';

function safeJsonParse(jsonStr: string, defaultValue: any = []): any {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return defaultValue;
  }
}

export async function dialogueRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const { category, search, page = 1, limit = 20 } = request.query as {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;
    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { titleKey: { contains: search } },
        { scenarioKey: { contains: search } },
        { responseKey: { contains: search } },
      ];
    }

    const [dialogues, total] = await Promise.all([
      prisma.dialogue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { useCount: 'desc' },
      }),
      prisma.dialogue.count({ where }),
    ]);

    return {
      success: true,
      data: {
        dialogues: dialogues.map((d: { id: string; tagsJson: string }) => ({
          ...d,
          tags: safeJsonParse(d.tagsJson),
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

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const dialogue = await prisma.dialogue.findUnique({
      where: { id },
    });

    if (!dialogue) {
      throw customError('NOT_FOUND', '话术不存在', 404);
    }

    await prisma.dialogue.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });

    return {
      success: true,
      data: {
        ...dialogue,
        tags: safeJsonParse(dialogue.tagsJson),
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/categories', async (request, reply) => {
    const categories = await prisma.dialogue.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    return {
      success: true,
      data: categories.map((c: { category: string; _count: { category: number } }) => ({
        name: c.category,
        count: c._count.category,
      })),
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/:id/favorite', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    const dialogue = await prisma.dialogue.findUnique({ where: { id } });
    if (!dialogue) {
      throw customError('NOT_FOUND', '话术不存在', 404);
    }

    try {
      if (userId && childId) {
        await prisma.favorite.upsert({
          where: { childId_dialogueId: { childId, dialogueId: id } },
          update: { updatedAt: new Date() },
          create: {
            userId,
            childId,
            dialogueId: id,
            type: 'DIALOGUE',
          },
        });
      } else if (anonymousId) {
        const existing = await prisma.favorite.findFirst({
          where: { anonymousId, dialogueId: id },
        });
        if (!existing) {
          await prisma.favorite.create({
            data: {
              anonymousId,
              dialogueId: id,
              type: 'DIALOGUE',
            },
          });
        }
      } else {
        throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
      }

      return { success: true, isFavorited: true };
    } catch (error) {
      logger.error('Failed to create dialogue favorite', { error, userId, anonymousId, dialogueId: id });
      throw error;
    }
  });

  fastify.delete('/:id/favorite', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    try {
      if (userId && childId) {
        await prisma.favorite.delete({
          where: { childId_dialogueId: { childId, dialogueId: id } },
        });
      } else if (anonymousId) {
        const existing = await prisma.favorite.findFirst({
          where: { anonymousId, dialogueId: id },
        });
        if (existing) {
          await prisma.favorite.delete({
            where: { id: existing.id },
          });
        }
      } else {
        throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
      }

      return { success: true, isFavorited: false };
    } catch {
      throw customError('NOT_FOUND', '收藏不存在', 404);
    }
  });

  fastify.get('/favorites', { preHandler: optionalAuth }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    if (!userId && !anonymousId) {
      return {
        success: true,
        data: {
          dialogues: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      let favorites: any[] = [];
      if (userId && childId) {
        favorites = await prisma.favorite.findMany({
          where: { childId, type: 'DIALOGUE', dialogueId: { not: null } },
          include: {
            dialogue: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (anonymousId) {
        favorites = await prisma.favorite.findMany({
          where: { anonymousId, type: 'DIALOGUE', dialogueId: { not: null } },
          include: {
            dialogue: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      const dialogues = favorites
        .filter((f) => f.dialogue)
        .map((f) => ({
          ...f.dialogue,
          tags: safeJsonParse(f.dialogue!.tagsJson),
        }));

      return {
        success: true,
        data: {
          dialogues,
          pagination: {
            page: 1,
            limit: dialogues.length,
            total: dialogues.length,
            totalPages: 1,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        success: true,
        data: {
          dialogues: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
        timestamp: new Date().toISOString(),
      };
    }
  });
}