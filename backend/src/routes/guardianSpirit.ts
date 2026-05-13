import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/authorization';
import { customError } from '../utils/errors';
import { prisma } from '../utils/database';

export async function guardianSpiritRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const spirits = await prisma.guardianSpirit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return {
      success: true,
      data: spirits,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const spirit = await prisma.guardianSpirit.findUnique({
      where: { id },
    });

    if (!spirit) {
      throw customError('NOT_FOUND', '未找到守护精灵', 404);
    }

    return {
      success: true,
      data: spirit,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { nameKey, descriptionKey, icon, color, type, isDefault, sortOrder } = request.body as {
      nameKey: string;
      descriptionKey?: string;
      icon: string;
      color: string;
      type?: string;
      isDefault?: boolean;
      sortOrder?: number;
    };

    const existing = await prisma.guardianSpirit.findFirst({
      where: { type },
    });

    if (existing) {
      throw customError('ALREADY_EXISTS', '该类型的守护精灵已存在', 400);
    }

    const spirit = await prisma.guardianSpirit.create({
      data: {
        nameKey,
        descriptionKey,
        icon,
        color,
        type: type || 'MOON',
        isDefault: isDefault || false,
        sortOrder: sortOrder || 0,
      },
    });

    return {
      success: true,
      data: spirit,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.put('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { nameKey, descriptionKey, icon, color, type, isDefault, sortOrder, isActive } = request.body as {
      nameKey?: string;
      descriptionKey?: string;
      icon?: string;
      color?: string;
      type?: string;
      isDefault?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    };

    const spirit = await prisma.guardianSpirit.findUnique({
      where: { id },
    });

    if (!spirit) {
      throw customError('NOT_FOUND', '未找到守护精灵', 404);
    }

    const updated = await prisma.guardianSpirit.update({
      where: { id },
      data: {
        ...(nameKey && { nameKey }),
        ...(descriptionKey && { descriptionKey }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(type && { type }),
        ...(isDefault !== undefined && { isDefault }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return {
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.delete('/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const spirit = await prisma.guardianSpirit.findUnique({
      where: { id },
    });

    if (!spirit) {
      throw customError('NOT_FOUND', '未找到守护精灵', 404);
    }

    await prisma.guardianSpirit.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      data: { message: '守护精灵已禁用' },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/default', async (request, reply) => {
    const defaultSpirit = await prisma.guardianSpirit.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!defaultSpirit) {
      const firstSpirit = await prisma.guardianSpirit.findFirst({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      return {
        success: true,
        data: firstSpirit,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: defaultSpirit,
      timestamp: new Date().toISOString(),
    };
  });
}
