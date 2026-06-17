import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/database';
import { customError } from '../utils/errors';
import { requireAuth } from '../middleware/authorization';

export async function i18nRoutes(fastify: FastifyInstance) {
  fastify.get('/export', async (request, reply) => {
    const { language } = request.query as { language?: string };

    const where = language ? { language, status: 'PUBLISHED' } : { status: 'PUBLISHED' };

    const resources = await prisma.i18nResource.findMany({
      where,
      orderBy: [{ language: 'asc' }, { resourceKey: 'asc' }],
    });

    if (language) {
      const translations: Record<string, string> = {};
      resources.forEach((resource) => {
        translations[resource.resourceKey] = resource.value;
      });
      return {
        success: true,
        data: { [language]: translations },
        timestamp: new Date().toISOString(),
      };
    } else {
      const translations: Record<string, Record<string, string>> = {};
      resources.forEach(resource => {
        if (!translations[resource.language]) {
          translations[resource.language] = {};
        }
        translations[resource.language][resource.resourceKey] = resource.value;
      });
      return {
        success: true,
        data: translations,
        timestamp: new Date().toISOString(),
      };
    }
  });

  fastify.get('/resources', async (request, reply) => {
    const { language, status, page = 1, limit = 50, search } = request.query as {
      language?: string;
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    };

    const skip = (page - 1) * limit;
    const where: any = {};

    if (language) where.language = language;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { resourceKey: { contains: search } },
        { value: { contains: search } },
      ];
    }

    const [resources, total] = await Promise.all([
      prisma.i18nResource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.i18nResource.count({ where }),
    ]);

    return {
      success: true,
      data: {
        resources,
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

  fastify.post('/resources', { preHandler: [requireAuth] }, async (request, reply) => {
    const { resourceKey, language, value, type = 'TEXT', status = 'DRAFT', author, notes } = request.body as {
      resourceKey: string;
      language: string;
      value: string;
      type?: string;
      status?: string;
      author?: string;
      notes?: string;
    };

    const existing = await prisma.i18nResource.findUnique({
      where: { resourceKey_language: { resourceKey, language } },
    });

    if (existing) {
      throw customError('CONFLICT', '资源已存在', 409);
    }

    const resource = await prisma.i18nResource.create({
      data: {
        resourceKey,
        language,
        value,
        type,
        status,
        author,
        notes,
        lastPublished: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    reply.status(201);
    return {
      success: true,
      data: resource,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.put('/resources/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const existing = await prisma.i18nResource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw customError('NOT_FOUND', '资源不存在', 404);
    }

    const updateData: any = { ...data };

    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      updateData.lastPublished = new Date();
    }

    if (data.status !== existing.status) {  updateData.version = existing.version + 1;
    }

    const resource = await prisma.i18nResource.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: resource,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.delete('/resources/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.i18nResource.delete({ where: { id } });
      return {
        success: true,
        data: { success: true },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw customError('NOT_FOUND', '资源不存在', 404);
    }
  });
}
