import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { customError } from './errors';
import { config } from '../config';

export const prisma = new PrismaClient({
  log: config.database.log as any,
});

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
  childId?: string;
  anonymousId?: string;
}

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    await (request as any).jwtVerify();
    const userId = ((request as any).user as any).userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    
    if (!user) {
      throw customError('UNAUTHORIZED', '用户不存在或已被删除，请重新登录', 401);
    }
    
    (request as AuthenticatedRequest).userId = userId;
  } catch (err) {
    throw customError('UNAUTHORIZED', '未授权，请重新登录', 401);
  }
};

export const optionalAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    await (request as any).jwtVerify();
    (request as AuthenticatedRequest).userId = ((request as any).user as any).userId;
  } catch {
    // Ignore error for optional auth
  }
  // 检查是否有匿名用户ID，验证格式后设置
  const anonymousId = request.headers['x-anonymous-id'] as string;
  if (anonymousId) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AnonymousUserService } = require('../services/AnonymousUserService');
    if (AnonymousUserService.validateAnonymousId(anonymousId)) {
      (request as AuthenticatedRequest).anonymousId = anonymousId;
    }
  }
};

export async function getChildId(request: FastifyRequest): Promise<string | null> {
  const userId = (request as AuthenticatedRequest).userId;
  if (!userId) {
    return null;
  }

  const child = await prisma.child.findFirst({
    where: { userId },
    select: { id: true },
  });

  return child?.id || null;
}

// 生成匿名用户ID（委托给专用服务）
export function generateAnonymousId(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AnonymousUserService } = require('../services/AnonymousUserService');
  return AnonymousUserService.generateAnonymousId();
}

export { AnonymousUserService } from '../services/AnonymousUserService';
