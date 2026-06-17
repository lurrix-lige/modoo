import { FastifyInstance } from "fastify";
import { authenticate, AuthenticatedRequest } from "../utils/database";
import { customError } from "../utils/errors";
import { config } from "../config";
import { sendVerificationCode } from "../services/verificationService";
import { validateAccount } from "../services/accountValidationService";
import { strictRateLimiter } from "../middleware/rateLimiter";
import { verifyAppleIdToken } from "../services/AppleAuthService";
import {
  loginWithPhone,
  loginWithApple,
  loginWithWechat,
  refreshAccessToken,
  logout,
} from "../services/authService";

export async function authRoutes(fastify: FastifyInstance) {
  const sendCodeRateLimit = strictRateLimiter();

  fastify.post("/send-code", {
    preHandler: [sendCodeRateLimit],
    schema: {
      body: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: { type: 'string', minLength: 11, maxLength: 11 },
        },
      },
    },
  }, async (request, reply) => {
    const { phone } = request.body as { phone: string };

    if (!phone) {
      throw customError("VALIDATION_ERROR", "请输入手机号", 400);
    }

    await validateAccount(phone);
    await sendVerificationCode(phone);

    return {
      success: true,
      data: {
        message: "验证码已发送",
        expiresIn: config.verification.expiryMinutes * 60,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post("/sendCode", { preHandler: [sendCodeRateLimit] }, async (request, reply) => {
    const { phone } = request.body as { phone: string };

    if (!phone) {
      throw customError("VALIDATION_ERROR", "请输入手机号", 400);
    }

    await validateAccount(phone);
    await sendVerificationCode(phone);

    return {
      success: true,
      data: {
        message: "验证码已发送",
        expiresIn: config.verification.expiryMinutes * 60,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post("/login", {
    schema: {
      body: {
        type: 'object',
        required: ['phone', 'code'],
        properties: {
          phone: { type: 'string', minLength: 11, maxLength: 11 },
          code: { type: 'string', minLength: 4, maxLength: 6 },
        },
      },
    },
  }, async (request, reply) => {
    const { phone, code } = request.body as { phone: string; code: string };

    if (!phone || !code) {
      throw customError("VALIDATION_ERROR", "请输入手机号和验证码", 400);
    }

    const result = await loginWithPhone(fastify, phone, code);

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post("/apple", async (request, reply) => {
    const { authorizationCode, identityToken } = request.body as {
      authorizationCode: string;
      identityToken: string;
    };

    if (!authorizationCode) {
      throw customError("VALIDATION_ERROR", "缺少authorizationCode", 400);
    }

    if (!identityToken) {
      throw customError("VALIDATION_ERROR", "缺少identityToken", 400);
    }

    try {
      const { apple } = config;

      if (!apple.teamId || !apple.keyId || !apple.privateKey || !apple.clientId) {
        throw customError("CONFIG_ERROR", "Apple登录配置不完整，请联系管理员", 500);
      }

      // Use proper Apple ID token verification with JWKS signature validation
      const payload = await verifyAppleIdToken(identityToken);

      const appleUserId = payload.sub;
      if (!appleUserId) {
        throw customError("INVALID_TOKEN", "Apple Identity Token缺少用户标识", 400);
      }

      const email = payload.email || undefined;

      const result = await loginWithApple(fastify, appleUserId, email, undefined);

      return {
        success: true,
        data: {
          ...result,
          appleNickname: result.user.nickname,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error({ err: error }, "Apple login error");
      if (error.code === "CONFIG_ERROR" || error.code === "INVALID_TOKEN") {
        throw error;
      }
      throw customError("APPLE_LOGIN_FAILED", "Apple登录失败", 500);
    }
  });

  fastify.post("/wechat", async (request, reply) => {
    const { code } = request.body as { code: string };

    if (!code) {
      throw customError("VALIDATION_ERROR", "缺少code", 400);
    }

    try {
      const { wechat } = config;

      if (!wechat.appId || !wechat.appSecret) {
        throw customError("CONFIG_ERROR", "微信登录配置不完整，请联系管理员", 500);
      }

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const axios = require("axios");

      const tokenResponse = await axios.get(config.wechat.oauthApi, {
        params: {
          appid: wechat.appId,
          secret: wechat.appSecret,
          code,
          grant_type: "authorization_code",
        },
      });

      const { access_token, openid, unionid } = tokenResponse.data;

      if (!openid) {
        throw customError("WECHAT_ERROR", "获取微信openid失败", 400);
      }

      let wechatNickname = "微信用户";
      let wechatAvatar = "";

      try {
        const userInfoResponse = await axios.get(config.wechat.userInfoApi, {
          params: {
            access_token,
            openid,
          },
        });

        if (userInfoResponse.data && userInfoResponse.data.nickname) {
          wechatNickname = userInfoResponse.data.nickname;
          wechatAvatar = userInfoResponse.data.headimgurl || "";
        }
      } catch (userInfoError) {
        fastify.log.warn({ err: userInfoError }, "Failed to get WeChat user info");
      }

      const result = await loginWithWechat(fastify, openid, unionid, wechatNickname, wechatAvatar);

      return {
        success: true,
        data: {
          ...result,
          wechatNickname,
          wechatAvatar,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      fastify.log.error({ err: error }, "WeChat login error");
      if (error.code === "CONFIG_ERROR" || error.code === "WECHAT_ERROR") {
        throw error;
      }
      throw customError("WECHAT_LOGIN_FAILED", "微信登录失败", 500);
    }
  });

  fastify.post("/refresh", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      throw customError("VALIDATION_ERROR", "缺少refreshToken", 400);
    }

    const tokens = await refreshAccessToken(fastify, refreshToken);

    return {
      success: true,
      data: tokens,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post("/logout", { preHandler: [authenticate] }, async (request, reply) => {
    const { userId } = request as AuthenticatedRequest;

    if (!userId) {
      throw customError("UNAUTHORIZED", "未授权，请重新登录", 401);
    }

    await logout(userId);

    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  });
}
