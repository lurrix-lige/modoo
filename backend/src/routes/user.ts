import { FastifyInstance } from 'fastify';
import { prisma, authenticate, AuthenticatedRequest } from '../utils/database';
import { customError } from '../utils/errors';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/profile', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        child: true, 
        subscriptions: { 
          where: { status: 'ACTIVE', currentPeriodEnd: { gt: new Date() } },
          include: { plan: true },
          orderBy: { currentPeriodEnd: 'desc' },
        },
      },
    });

    if (!user) {
      throw customError('NOT_FOUND', '用户不存在', 404);
    }

    const activeSubscription = user.subscriptions.find(s => s.status === 'ACTIVE');

    return {
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        isPaid: !!activeSubscription,
        membership: activeSubscription ? {
          plan: activeSubscription.plan?.planKey.toLowerCase() || activeSubscription.planId,
          startedAt: activeSubscription.currentPeriodStart,
          expiresAt: activeSubscription.currentPeriodEnd,
        } : null,
        child: user.child || null,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.put('/profile', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { nickname, avatar } = request.body as { nickname?: string; avatar?: string };

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname && { nickname }),
        ...(avatar && { avatar }),
      },
    });

    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/child', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;

    const child = await prisma.child.findFirst({
      where: { userId },
      include: { guardianSpirit: true },
    });

    if (!child) {
      throw customError('NOT_FOUND', '未找到孩子档案', 404);
    }

    return {
      success: true,
      data: child,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/child', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { nickname, birthday, gender, guardianSpiritId, sleepProblems } = request.body as {
      nickname: string;
      birthday: string;
      gender: string;
      guardianSpiritId?: string;
      sleepProblems?: string;
    };

    const existingChild = await prisma.child.findFirst({
      where: { userId },
    });

    if (existingChild) {
      throw customError('ALREADY_EXISTS', '孩子档案已存在', 400);
    }

    if (guardianSpiritId) {
      const guardianSpirit = await prisma.guardianSpirit.findUnique({
        where: { id: guardianSpiritId },
      });
      if (!guardianSpirit) {
        throw customError('INVALID_GUARDIAN_SPIRIT', '指定的守护精灵不存在', 400);
      }
    }

    const child = await prisma.child.create({
      data: {
        userId,
        nickname,
        birthday: new Date(birthday),
        gender,
        guardianSpiritId,
        sleepProblems: sleepProblems || '',
      },
    });

    return {
      success: true,
      data: child,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.put('/child', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { nickname, birthday, gender, guardianSpiritId, sleepProblems } = request.body as {
      nickname?: string;
      birthday?: string;
      gender?: string;
      guardianSpiritId?: string;
      sleepProblems?: string;
    };

    const child = await prisma.child.findFirst({
      where: { userId },
    });

    if (!child) {
      throw customError('NOT_FOUND', '未找到孩子档案', 404);
    }

    if (guardianSpiritId) {
      const guardianSpirit = await prisma.guardianSpirit.findUnique({
        where: { id: guardianSpiritId },
      });
      if (!guardianSpirit) {
        throw customError('INVALID_GUARDIAN_SPIRIT', '指定的守护精灵不存在', 400);
      }
    }

    const updated = await prisma.child.update({
      where: { id: child.id },
      data: {
        ...(nickname && { nickname }),
        ...(birthday && { birthday: new Date(birthday) }),
        ...(gender && { gender }),
        ...(guardianSpiritId && { guardianSpiritId }),
        ...(sleepProblems !== undefined && { sleepProblems }),
      },
    });

    return {
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/push-token', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId!;
    const { token, platform } = request.body as { token: string; platform: string };

    fastify.log.info({ userId, platform }, 'Push token received');

    return {
      success: true,
      message: '推送令牌已记录',
      timestamp: new Date().toISOString(),
    };
  });
}
