import { FastifyInstance } from "fastify";
import { prisma } from "../utils/database";
import { customError } from "../utils/errors";
import { nanoid } from "nanoid";
import { config } from "../config";
import { validateAccount } from "./accountValidationService";
import { verifyCode } from "./verificationService";
import { findOrCreateUserByPhone, findOrCreateUserByApple, findOrCreateUserByWechat } from "./userService";

const ACCESS_TOKEN_EXPIRES_IN = config.jwt.accessTokenExpiresIn;
const REFRESH_TOKEN_EXPIRES_DAYS = config.jwt.refreshTokenExpiresDays;

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string;
    nickname: string | null;
    avatar: string | null;
    isNewUser: boolean;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function generateTokens(fastify: FastifyInstance, userId: string): Promise<TokenPair> {
  const accessToken = fastify.jwt.sign(
    { userId },
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = nanoid(64);
  const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    },
  });

  const expiresInMatch = ACCESS_TOKEN_EXPIRES_IN.match(/^(\d+)(m|h|d)$/);
  let expiresInSeconds = 15 * 60;
  if (expiresInMatch) {
    const value = parseInt(expiresInMatch[1]);
    const unit = expiresInMatch[2];
    switch (unit) {
      case "m":
        expiresInSeconds = value * 60;
        break;
      case "h":
        expiresInSeconds = value * 60 * 60;
        break;
      case "d":
        expiresInSeconds = value * 24 * 60 * 60;
        break;
    }
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: expiresInSeconds,
  };
}

export async function loginWithPhone(
  fastify: FastifyInstance,
  phone: string,
  code: string,
): Promise<LoginResult> {
  await validateAccount(phone);

  const isValidCode = await verifyCode(phone, code);
  if (!isValidCode) {
    throw customError("VALIDATION_ERROR", "验证码错误或已过期", 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !existingUser;

  const user = await findOrCreateUserByPhone(phone);

  const tokens = await generateTokens(fastify, user.id);

  return {
    ...tokens,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      isNewUser,
    },
  };
}

export async function loginWithApple(
  fastify: FastifyInstance,
  appleUserId: string,
  appleEmail?: string,
  nickname?: string,
): Promise<LoginResult> {
  const existingUser = await prisma.user.findFirst({ where: { appleUserId } });
  const isNewUser = !existingUser;

  const user = await findOrCreateUserByApple(appleUserId, appleEmail, nickname);

  const tokens = await generateTokens(fastify, user.id);

  return {
    ...tokens,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      isNewUser,
    },
  };
}

export async function loginWithWechat(
  fastify: FastifyInstance,
  wechatOpenid: string,
  wechatUnionid?: string,
  nickname?: string,
  avatar?: string,
): Promise<LoginResult> {
  const existingUser = await prisma.user.findFirst({ where: { wechatOpenid } });
  const isNewUser = !existingUser;

  const user = await findOrCreateUserByWechat(wechatOpenid, wechatUnionid, nickname, avatar);

  const tokens = await generateTokens(fastify, user.id);

  return {
    ...tokens,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      isNewUser,
    },
  };
}

export async function refreshAccessToken(
  fastify: FastifyInstance,
  refreshToken: string,
): Promise<TokenPair> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw customError("UNAUTHORIZED", "refreshToken已过期，请重新登录", 401);
  }

  // 不要立即删除旧 token，允许一定宽限期内的并发请求使用
  // TODO:后台可以单独运行一个定期任务清理过期 token
  return generateTokens(fastify, storedToken.userId);
}

export async function logout(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}
