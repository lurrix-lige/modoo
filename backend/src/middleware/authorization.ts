import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/database';
import { customError, ErrorCodes } from '../utils/errors';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (error: any) {
    const errorCode = error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' 
      ? ErrorCodes.AUTH_TOKEN_MISSING
      : error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED'
      ? ErrorCodes.AUTH_TOKEN_EXPIRED
      : ErrorCodes.AUTH_TOKEN_INVALID;
    
    throw customError(errorCode, '请先登录', 401);
  }
}

export async function requireMembership(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);

  const authenticatedRequest = request as unknown as { userId: string };
  const userId = authenticatedRequest.userId;

  const subscription = await prisma.subscription.findFirst({
    where: { 
      userId, 
      status: 'ACTIVE',
      currentPeriodEnd: { gt: new Date() }
    },
  });

  if (!subscription) {
    throw customError(ErrorCodes.AUTH_REQUIRE_MEMBERSHIP, '需要开通会员才能访问', 403);
  }
}

export async function optionalAuth(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch {
  }
}