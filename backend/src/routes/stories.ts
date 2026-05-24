import { FastifyInstance } from 'fastify';
import { prisma, optionalAuth, AuthenticatedRequest, getChildId } from '../utils/database';
import { customError } from '../utils/errors';
import { requireMembership } from '../middleware/authorization';
import { logger } from '../utils/logger';

export async function storyRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: optionalAuth }, async (request, reply) => {
    const { category, page = 1, limit = 20 } = request.query as {
      category?: string;
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;
    const where: Record<string, any> = { deletedAt: null };
    if (category) where.category = category;

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.story.count({ where }),
    ]);

    const userProgress: Map<string, { progress: number; completed: boolean }> = new Map();
    const userFavorites: Set<string> = new Set();

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    if (userId && childId) {
      try {
        const history = await prisma.playHistory.findMany({
          where: { childId, storyId: { in: stories.map((s: { id: string }) => s.id) } },
        });
        history.forEach((h: { storyId: string; progress: number; completed: boolean }) => {
          userProgress.set(h.storyId, { progress: h.progress, completed: h.completed });
        });
        
        const favorites = await prisma.favorite.findMany({
          where: { childId, storyId: { in: stories.map((s: { id: string }) => s.id) } },
        });
        favorites.forEach((f) => {
          if (f.storyId) {
            userFavorites.add(f.storyId);
          }
        });
      } catch {
        // Ignore if no child profile
      }
    } else if (anonymousId) {
      try {
        const history = await prisma.playHistory.findMany({
          where: { anonymousId, storyId: { in: stories.map((s: { id: string }) => s.id) } },
        });
        history.forEach((h: { storyId: string; progress: number; completed: boolean }) => {
          userProgress.set(h.storyId, { progress: h.progress, completed: h.completed });
        });
        
        const favorites = await prisma.favorite.findMany({
          where: { anonymousId, storyId: { in: stories.map((s: { id: string }) => s.id) } },
        });
        favorites.forEach((f) => {
          if (f.storyId) {
            userFavorites.add(f.storyId);
          }
        });
      } catch {
        // Ignore errors
      }
    }

    return {
      success: true,
      data: {
        stories: stories.map((s: { id: string }) => ({
          ...s,
          progress: userProgress.get(s.id)?.progress || 0,
          completed: userProgress.get(s.id)?.completed || false,
          isFavorite: userFavorites.has(s.id),
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

    const story = await prisma.story.findFirst({ where: { id, deletedAt: null } });

    if (!story) {
      throw customError('NOT_FOUND', '故事不存在', 404);
    }

    let progress = { progress: 0, completed: false, isFavorite: false };

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    if (userId && childId) {
      try {
        const history = await prisma.playHistory.findUnique({
          where: { childId_storyId: { childId, storyId: id } },
        });
        if (history) {
          progress = { ...progress, progress: history.progress, completed: history.completed };
        }
        
        const favorite = await prisma.favorite.findUnique({
          where: { childId_storyId: { childId, storyId: id } },
        });
        if (favorite) {
          progress.isFavorite = true;
        }
      } catch {
        // Ignore if no child profile
      }
    } else if (anonymousId) {
      try {
        const history = await prisma.playHistory.findFirst({
          where: { anonymousId, storyId: id },
        });
        if (history) {
          progress = { ...progress, progress: history.progress, completed: history.completed };
        }
        
        const favorite = await prisma.favorite.findFirst({
          where: { anonymousId, storyId: id },
        });
        if (favorite) {
          progress.isFavorite = true;
        }
      } catch {
        // Ignore errors
      }
    }

    return {
      success: true,
      data: { ...story, ...progress },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/:id/progress', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { progress, completed } = request.body as { progress: number; completed: boolean };
    
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    const story = await prisma.story.findFirst({ where: { id, deletedAt: null } });
    if (!story) {
      throw customError('NOT_FOUND', '故事不存在', 404);
    }

    let history;
    
    if (userId && childId) {
      history = await prisma.playHistory.upsert({
        where: { childId_storyId: { childId, storyId: id } },
        update: { progress, completed, lastPlayedAt: new Date() },
        create: {
          userId,
          childId,
          storyId: id,
          progress,
          completed,
        },
      });
    } else if (anonymousId) {
      // 查找现有的匿名记录
      const existing = await prisma.playHistory.findFirst({
        where: { anonymousId, storyId: id },
      });
      
      if (existing) {
        history = await prisma.playHistory.update({
          where: { id: existing.id },
          data: { progress, completed, lastPlayedAt: new Date() },
        });
      } else {
        history = await prisma.playHistory.create({
          data: {
            anonymousId,
            storyId: id,
            progress,
            completed,
          },
        });
      }
    } else {
      throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
    }

    return {
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/:id/audio', { preHandler: requireMembership }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const story = await prisma.story.findFirst({ where: { id, deletedAt: null } });

    if (!story) {
      throw customError('NOT_FOUND', '故事不存在', 404);
    }

    reply.header('Content-Type', 'audio/mpeg');
    reply.header('Content-Disposition', `attachment; filename="${story.title}.mp3"`);

    try {
      const audioResponse = await fetch(story.audioUrl);
      const audioBuffer = await audioResponse.arrayBuffer();
      return reply.send(Buffer.from(audioBuffer));
    } catch {
      throw customError('INTERNAL_ERROR', '无法获取音频文件', 500);
    }
  });

  fastify.post('/:id/favorite', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    const story = await prisma.story.findFirst({ where: { id, deletedAt: null } });
    if (!story) {
      throw customError('NOT_FOUND', '故事不存在', 404);
    }

    if (userId && childId) {
      await prisma.favorite.upsert({
        where: { childId_storyId: { childId, storyId: id } },
        update: { updatedAt: new Date() },
        create: {
          userId,
          childId,
          storyId: id,
          type: 'STORY',
        },
      });
    } else if (anonymousId) {
      const existing = await prisma.favorite.findFirst({
        where: { anonymousId, storyId: id },
      });
      
      if (!existing) {
        await prisma.favorite.create({
          data: {
            anonymousId,
            storyId: id,
            type: 'STORY',
          },
        });
      }
    } else {
      throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
    }

    return { success: true, isFavorite: true };
  });

  fastify.delete('/:id/favorite', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    try {
      if (userId && childId) {
        await prisma.favorite.delete({
          where: { childId_storyId: { childId, storyId: id } },
        });
      } else if (anonymousId) {
        const existing = await prisma.favorite.findFirst({
          where: { anonymousId, storyId: id },
        });
        if (existing) {
          await prisma.favorite.delete({
            where: { id: existing.id },
          });
        }
      } else {
        throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
      }
      
      return { success: true, isFavorite: false };
    } catch (e) {
      throw customError('NOT_FOUND', '收藏不存在', 404);
    }
  });

  fastify.post('/:id/share', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { platform?: string } | undefined;
    const platform = body?.platform;
    
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    const story = await prisma.story.findFirst({ where: { id, deletedAt: null } });
    if (!story) {
      throw customError('NOT_FOUND', '故事不存在', 404);
    }

    let share;
    
    if (userId && childId) {
      const existingShare = await prisma.share.findFirst({
        where: { childId, storyId: id },
      });
      
      if (existingShare) {
        return { success: true, shareId: existingShare.id };
      }
      
      try {
        share = await prisma.share.create({
          data: {
            userId,
            childId,
            storyId: id,
            type: 'STORY',
            platform,
          },
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          const existing = await prisma.share.findFirst({
            where: { childId, storyId: id },
          });
          if (existing) {
            return { success: true, shareId: existing.id };
          }
        }
        logger.error('Failed to create share for user', { 
          errorMessage: String(error.message), 
          errorCode: error.code, 
          userId, 
          childId, 
          storyId: id 
        });
        throw error;
      }
    } else if (anonymousId) {
      const existingShare = await prisma.share.findFirst({
        where: { anonymousId, storyId: id },
      });
      
      if (existingShare) {
        return { success: true, shareId: existingShare.id };
      }
      
      try {
        share = await prisma.share.create({
          data: {
            anonymousId,
            storyId: id,
            type: 'STORY',
            platform,
          },
        });
      } catch (error: any) {
        if (error && error.code === 'P2002') {
          const existing = await prisma.share.findFirst({
            where: { anonymousId, storyId: id },
          });
          if (existing) {
            return { success: true, shareId: existing.id };
          }
        }
        const errorMessage = error && error.message ? String(error.message) : 'Unknown error';
        const errorCode = error && error.code ? String(error.code) : 'UNKNOWN';
        logger.error('Failed to create share for anonymous', { 
          errorMessage, 
          errorCode, 
          anonymousId, 
          storyId: id 
        });
        throw error;
      }
    } else {
      throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
    }

    return { success: true, shareId: share.id };
  });

  fastify.get('/stats/summary', { preHandler: optionalAuth }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);
    
    if (!userId && !anonymousId) {
      return {
        storiesCompleted: 0,
        totalStories: 0,
        favoritesCount: 0,
        recentlyPlayed: [],
      };
    }

    try {
      let completedHistory = 0;
      let favorites = 0;
      let recentHistory: any[] = [];
      
      const totalStories = await prisma.story.count();

      if (userId && childId) {
        [completedHistory, favorites, recentHistory] = await Promise.all([
          prisma.playHistory.count({
            where: { childId, completed: true },
          }),
          prisma.favorite.count({
            where: { childId, type: 'STORY' },
          }),
          prisma.playHistory.findMany({
            where: { childId },
            orderBy: { lastPlayedAt: 'desc' },
            take: 5,
            include: {
              story: {
                select: { id: true, title: true, coverUrl: true },
              },
            },
          }),
        ]);
      } else if (anonymousId) {
        [completedHistory, favorites, recentHistory] = await Promise.all([
          prisma.playHistory.count({
            where: { anonymousId, completed: true },
          }),
          prisma.favorite.count({
            where: { anonymousId, type: 'STORY' },
          }),
          prisma.playHistory.findMany({
            where: { anonymousId },
            orderBy: { lastPlayedAt: 'desc' },
            take: 5,
            include: {
              story: {
                select: { id: true, title: true, coverUrl: true },
              },
            },
          }),
        ]);
      }

      return {
        storiesCompleted: completedHistory,
        totalStories,
        favoritesCount: favorites,
        recentlyPlayed: recentHistory.map(h => ({
          id: h.story.id,
          title: h.story.title,
          coverUrl: h.story.coverUrl,
          lastPlayedAt: h.lastPlayedAt,
        })),
      };
    } catch {
      return {
        storiesCompleted: 0,
        totalStories: 0,
        favoritesCount: 0,
        recentlyPlayed: [],
      };
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
          stories: [],
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
          where: { childId, type: 'STORY', storyId: { not: null } },
          include: {
            story: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (anonymousId) {
        favorites = await prisma.favorite.findMany({
          where: { anonymousId, type: 'STORY', storyId: { not: null } },
          include: {
            story: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      const stories = favorites
        .filter((f) => f.story)
        .map((f) => ({
          ...f.story,
          isFavorite: true,
        }));

      return {
        success: true,
        data: {
          stories,
          pagination: {
            page: 1,
            limit: stories.length,
            total: stories.length,
            totalPages: 1,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        success: true,
        data: {
          stories: [],
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
