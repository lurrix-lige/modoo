import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import Fastify from 'fastify';

// Mock config before any imports
vi.mock('../../config', () => ({
  config: {
    jwt: { secret: 'test-secret' },
    verification: { expiryMinutes: 5, maxAttempts: 5, maxVerifyAttempts: 3, rateLimitWindowMs: 60000, enableRealSms: false },
    server: { env: 'test', apiBaseUrl: 'http://localhost:3000' },
    apple: { teamId: '', keyId: '', privateKey: '', clientId: '' },
    wechat: { appId: '', appSecret: '' },
  },
}));

vi.mock('../../services/verificationService', () => ({
  sendVerificationCode: vi.fn(),
}));

vi.mock('../../services/accountValidationService', () => ({
  validateAccount: vi.fn(),
}));

vi.mock('../../services/authService', () => ({
  loginWithPhone: vi.fn(),
  loginWithApple: vi.fn(),
  loginWithWechat: vi.fn(),
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../../utils/errors', () => {
  const actual = vi.importActual('../../utils/errors');
  return actual;
});

vi.mock('../../utils/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
  authenticate: vi.fn(async (request: any, reply: any) => {
    // Default: pass through (test can override)
  }),
  AuthenticatedRequest: {} as any,
}));

import { authRoutes } from '../../routes/auth';
import { sendVerificationCode } from '../../services/verificationService';
import { validateAccount } from '../../services/accountValidationService';
import { loginWithPhone, refreshAccessToken, logout } from '../../services/authService';
import { authenticate } from '../../utils/database';

async function buildApp() {
  const app = Fastify({ logger: false });

  await app.register((await import('@fastify/jwt')).default || (await import('@fastify/jwt')), {
    secret: 'test-secret',
  });

  app.setErrorHandler((error: any, request: any, reply: any) => {
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal Server Error',
      },
      timestamp: new Date().toISOString(),
    });
  });

  await app.register(authRoutes, { prefix: '/auth' });

  return app;
}

describe('Auth Routes Integration', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/send-code', () => {
    it('should send verification code successfully', async () => {
      vi.mocked(sendVerificationCode).mockResolvedValue({ code: '123456', expiresAt: new Date() });
      vi.mocked(validateAccount).mockResolvedValue(true);

      const res = await app.inject({
        method: 'POST',
        url: '/auth/send-code',
        payload: { phone: '13800138000' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.message).toBe('验证码已发送');
      expect(body.data.expiresIn).toBe(300);
    });

    it('should return 400 when phone is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/send-code',
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when phone is empty string', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/send-code',
        payload: { phone: '' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      vi.mocked(loginWithPhone).mockResolvedValue({
        user: { id: 'user-1', phone: '13800138000', nickname: null },
        accessToken: 'test-access-token',
      } as any);

      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { phone: '13800138000', code: '123456' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.user.phone).toBe('13800138000');
    });

    it('should return 400 when phone is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { code: '123456' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should return 400 when code is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { phone: '13800138000' },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      } as any);

      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken: 'valid-refresh-token' },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBe('new-access-token');
    });

    it('should return 400 when refreshToken is missing', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout authenticated user', async () => {
      // Mock authenticate to set userId (matching the real preHandler behavior)
      vi.mocked(authenticate).mockImplementation(async (request: any) => {
        request.userId = 'user-1';
      });
      vi.mocked(logout).mockResolvedValue(undefined);

      const res = await app.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(authenticate).mockImplementation(async () => {
        const err: any = new Error('未授权，请重新登录');
        err.statusCode = 401;
        err.code = 'UNAUTHORIZED';
        throw err;
      });

      const res = await app.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
