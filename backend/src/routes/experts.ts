import { FastifyInstance } from 'fastify';
import { prisma, authenticate, AuthenticatedRequest } from '../utils/database';
import { customError } from '../utils/errors';

export async function expertRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as {
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;

    const [experts, total] = await Promise.all([
      prisma.expert.findMany({
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      prisma.expert.count(),
    ]);

    return {
      success: true,
      data: {
        experts: experts.map((e: { id: string; specialtyKeysJson: string; availableTimesJson: string | null }) => ({
          ...e,
          specialtyKeys: JSON.parse(e.specialtyKeysJson),
          availableTimes: e.availableTimesJson ? JSON.parse(e.availableTimesJson) : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
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

    const expert = await prisma.expert.findFirst({
      where: { id, deletedAt: null },
    });

    if (!expert) {
      throw customError('NOT_FOUND', '专家不存在', 404);
    }

    return {
      success: true,
      data: {
        ...expert,
        specialtyKeys: JSON.parse(expert.specialtyKeysJson),
        availableTimes: expert.availableTimesJson ? JSON.parse(expert.availableTimesJson) : ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/:id/time-slots', async (request, reply) => {
    const { date } = request.query as { date?: string };

    const targetDate = date || new Date().toISOString().split('T')[0];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

    return {
      success: true,
      data: { date: targetDate, times },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/bookings', { preHandler: [authenticate] }, async (request, reply) => {
    const { expertId, date, time, notes } = request.body as {
      expertId: string;
      date: string;
      time: string;
      notes?: string;
    };

    const userId = (request as AuthenticatedRequest).userId!;

    const expert = await prisma.expert.findUnique({ where: { id: expertId } });
    if (!expert) {
      throw customError('NOT_FOUND', '专家不存在', 404);
    }

    const booking = await prisma.booking.create({
      data: {
        expertId,
        userId,
        date,
        time,
        notes,
      },
    });

    return {
      success: true,
      data: booking,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/bookings/my', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { status } = request.query as { status?: string };

    const where: any = { userId };
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: { expert: true },
      orderBy: { date: 'desc' },
    });

    return {
      success: true,
      data: bookings,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.put('/bookings/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw customError('NOT_FOUND', '预约不存在', 404);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return {
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/bookings/:id/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request as AuthenticatedRequest).userId!;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw customError('NOT_FOUND', '预约不存在', 404);
    }

    if (booking.userId !== userId) {
      throw customError('FORBIDDEN', '无权取消此预约', 403);
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw customError('INVALID_STATUS', '无法取消此状态的预约', 400);
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return {
      success: true,
      message: '预约已取消',
      timestamp: new Date().toISOString(),
    };
  });
}
