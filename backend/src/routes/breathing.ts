import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/database';
import { successResponse, errorResponse, ErrorCodes } from '../utils/apiResponse';

export async function breathingRoutes(fastify: FastifyInstance) {
  fastify.get('/exercises', async (request, reply) => {
    const { difficulty, page = 1, limit = 20 } = request.query as {
      difficulty?: string;
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;
    const where = difficulty ? { difficulty } : {};

    const [exercises, total] = await Promise.all([
      prisma.breathingExercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.breathingExercise.count({ where }),
    ]);

    return successResponse(
      {
        exercises: exercises.map((e: { id: string; phasesJson: string }) => ({
          ...e,
          phases: JSON.parse(e.phasesJson),
        })),
      },
      {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  });

  fastify.get('/exercises/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const exercise = await prisma.breathingExercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return reply.code(404).send(errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, '呼吸练习不存在'));
    }

    return successResponse({
      ...exercise,
      phases: JSON.parse(exercise.phasesJson),
    });
  });

  fastify.get('/white-noises', async (request, reply) => {
    const { category, page = 1, limit = 20 } = request.query as {
      category?: string;
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;
    const where = category ? { category } : {};

    const [noises, total] = await Promise.all([
      prisma.whiteNoise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.whiteNoise.count({ where }),
    ]);

    return successResponse(
      { noises },
      {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  });

  fastify.get('/white-noises/categories', async (request, reply) => {
    const categories = await prisma.whiteNoise.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    return successResponse(categories.map((c: { category: string; _count: { category: number } }) => ({
      name: c.category,
      count: c._count.category,
    })));
  });
}
