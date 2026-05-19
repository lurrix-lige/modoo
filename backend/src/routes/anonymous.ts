import { FastifyInstance } from 'fastify';
import { AnonymousUserService } from '../services/AnonymousUserService';
import { authenticate, AuthenticatedRequest, prisma } from '../utils/database';

export async function anonymousRoutes(fastify: FastifyInstance) {
  /**
   * 生成新的匿名用户ID
   * GET /api/v1/anonymous/generate
   */
  fastify.get('/generate', async (request, reply) => {
    const deviceId = request.headers['x-device-id'] as string;
    const anonymousUser = await AnonymousUserService.createAnonymousUser(deviceId);

    return {
      success: true,
      data: {
        anonymousId: anonymousUser.id,
        expiresAt: anonymousUser.expiresAt.toISOString(),
      },
      message: '匿名用户ID生成成功',
    };
  });

  /**
   * 验证匿名用户ID是否有效
   * POST /api/v1/anonymous/validate
   */
  fastify.post('/validate', async (request, reply) => {
    const { anonymousId } = request.body as { anonymousId: string };
    
    const isValid = AnonymousUserService.validateAnonymousId(anonymousId);
    const isNotExpired = AnonymousUserService.isAnonymousIdValid(anonymousId);

    return {
      success: true,
      data: {
        isValid,
        isNotExpired,
        isValidAndActive: isValid && isNotExpired,
      },
    };
  });

  /**
   * 获取匿名用户的统计数据
   * POST /api/v1/anonymous/stats
   */
  fastify.post('/stats', async (request, reply) => {
    const { anonymousId } = request.body as { anonymousId: string };

    if (!AnonymousUserService.validateAnonymousId(anonymousId)) {
      return reply.status(400).send({
        success: false,
        message: '无效的匿名用户ID格式',
      });
    }

    const stats = await AnonymousUserService.getAnonymousUserStats(anonymousId);

    return {
      success: true,
      data: stats,
    };
  });

  /**
   * 登录后迁移匿名用户数据到正式用户
   * POST /api/v1/anonymous/migrate
   * 需要认证
   */
  fastify.post(
    '/migrate',
    { preHandler: authenticate },
    async (request, reply) => {
      const { anonymousId } = request.body as { anonymousId: string };
      const userId = (request as AuthenticatedRequest).userId;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: '用户未登录',
        });
      }

      if (!AnonymousUserService.validateAnonymousId(anonymousId)) {
        return reply.status(400).send({
          success: false,
          message: '无效的匿名用户ID格式',
        });
      }

      // 获取当前用户的第一个孩子（如果有）
      const child = await prisma.child.findFirst({
        where: { userId },
        select: { id: true },
      });

      const result = await AnonymousUserService.migrateAnonymousData(
        anonymousId,
        userId,
        child?.id
      );

      return {
        success: result.success,
        data: result.migratedRecords,
        message: result.message,
      };
    }
  );
}
