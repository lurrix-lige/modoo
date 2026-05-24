import { FastifyInstance } from 'fastify';
import { prisma, optionalAuth, AuthenticatedRequest, getChildId } from '../utils/database';
import { customError } from '../utils/errors';
import { logger } from '../utils/logger';

export async function articleRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const { category, page = 1, limit = 20 } = request.query as {
      category?: string;
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;
    const where = category ? { category } : {};

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          coverUrl: true,
          summary: true,
          readTime: true,
          views: true,
          publishedAt: true,
        },
      }),
      prisma.article.count({ where }),
    ]);

    return {
      success: true,
      data: {
        articles: articles.map(a => ({
          ...a,
          publishDate: a.publishedAt,
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

    const article = await prisma.article.findFirst({ where: { id, deletedAt: null } });

    if (!article) {
      throw customError('NOT_FOUND', '文章不存在', 404);
    }

    await prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    let isFavorited = false;

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    if (userId && childId) {
      try {
        const favorite = await prisma.favorite.findUnique({
          where: { childId_articleId: { childId, articleId: id } },
        });
        if (favorite) {
          isFavorited = true;
        }
      } catch {
        // Ignore if no child profile
      }
    } else if (anonymousId) {
      try {
        const favorite = await prisma.favorite.findFirst({
          where: { anonymousId, articleId: id },
        });
        if (favorite) {
          isFavorited = true;
        }
      } catch {
        // Ignore errors
      }
    }

    return {
      success: true,
      data: { ...article, isFavorited },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/categories', async (request, reply) => {
    const categories = await prisma.article.groupBy({
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

    const article = await prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!article) {
      throw customError('NOT_FOUND', '文章不存在', 404);
    }

    if (userId && childId) {
      await prisma.favorite.upsert({
        where: { childId_articleId: { childId, articleId: id } },
        update: { updatedAt: new Date() },
        create: {
          userId,
          childId,
          articleId: id,
          type: 'ARTICLE',
        },
      });
    } else if (anonymousId) {
      const existing = await prisma.favorite.findFirst({
        where: { anonymousId, articleId: id },
      });
      if (!existing) {
        await prisma.favorite.create({
          data: {
            anonymousId,
            articleId: id,
            type: 'ARTICLE',
          },
        });
      }
    } else {
      throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
    }

    return { success: true, isFavorited: true };
  });

  fastify.delete('/:id/favorite', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    try {
      if (userId && childId) {
        await prisma.favorite.delete({
          where: { childId_articleId: { childId, articleId: id } },
        });
      } else if (anonymousId) {
        const existing = await prisma.favorite.findFirst({
          where: { anonymousId, articleId: id },
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

  fastify.post('/:id/share', { preHandler: optionalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { platform } = request.body as { platform?: string };

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    const article = await prisma.article.findFirst({ where: { id, deletedAt: null } });
    if (!article) {
      throw customError('NOT_FOUND', '文章不存在', 404);
    }

    let share;
    try {
      if (userId && childId) {
        share = await prisma.share.create({
          data: {
            userId,
            childId,
            articleId: id,
            type: 'ARTICLE',
            platform,
          },
        });
      } else if (anonymousId) {
        share = await prisma.share.create({
          data: {
            anonymousId,
            articleId: id,
            type: 'ARTICLE',
            platform,
          },
        });
      } else {
        throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
      }

      return { success: true, shareId: share.id };
    } catch (error) {
      logger.error('Failed to create article share record', { error, userId, anonymousId, articleId: id });
      throw error;
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
          articles: [],
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
          where: { childId, type: 'ARTICLE', articleId: { not: null } },
          include: {
            article: {
              select: {
                id: true,
                title: true,
                category: true,
                coverUrl: true,
                summary: true,
                readTime: true,
                views: true,
                publishedAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else if (anonymousId) {
        favorites = await prisma.favorite.findMany({
          where: { anonymousId, type: 'ARTICLE', articleId: { not: null } },
          include: {
            article: {
              select: {
                id: true,
                title: true,
                category: true,
                coverUrl: true,
                summary: true,
                readTime: true,
                views: true,
                publishedAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      const articles = favorites
        .filter((f) => f.article)
        .map((f) => ({
          ...f.article,
          publishDate: f.article!.publishedAt,
        }));

      return {
        success: true,
        data: {
          articles,
          pagination: {
            page: 1,
            limit: articles.length,
            total: articles.length,
            totalPages: 1,
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        success: true,
        data: {
          articles: [],
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