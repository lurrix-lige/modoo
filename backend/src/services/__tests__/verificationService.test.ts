import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/database', () => ({
  prisma: {
    verificationCode: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '../../utils/database';
import {
  sendVerificationCode,
  verifyCode,
  cleanupExpiredCodes,
  resetVerificationAttempts,
} from '../verificationService';

describe('VerificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetVerificationAttempts('13800138000');
    resetVerificationAttempts('13900139000');
  });

  describe('sendVerificationCode', () => {
    it('should generate a 6-digit verification code', async () => {
      vi.mocked(prisma.verificationCode.count).mockResolvedValue(0);
      vi.mocked(prisma.verificationCode.create).mockResolvedValue({} as any);

      const result = await sendVerificationCode('13800138000');

      expect(result.code).toMatch(/^\d{6}$/);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should create a verification code record in database', async () => {
      vi.mocked(prisma.verificationCode.count).mockResolvedValue(0);
      const createSpy = vi.mocked(prisma.verificationCode.create).mockResolvedValue({} as any);

      const result = await sendVerificationCode('13800138000');

      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phone: '13800138000',
          code: result.code,
          expiresAt: result.expiresAt,
        }),
      });
    });

    it('should enforce rate limit when too many recent attempts', async () => {
      vi.mocked(prisma.verificationCode.count).mockResolvedValue(5);

      await expect(sendVerificationCode('13900139000')).rejects.toThrow('请求过于频繁');
    });

  });

  describe('verifyCode', () => {
    it('should return false for incorrect verification code', async () => {
      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(null);

      const result = await verifyCode('13800138000', '000000');

      expect(result).toBe(false);
    });

    it('should return false for expired code', async () => {
      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(null);

      const result = await verifyCode('13800138000', '123456');

      expect(result).toBe(false);
    });

    it('should lock account after max failed attempts', async () => {
      vi.mocked(prisma.verificationCode.findFirst).mockResolvedValue(null);

      await verifyCode('13800138000', '111111');
      await verifyCode('13800138000', '222222');

      await expect(verifyCode('13800138000', '333333')).rejects.toThrow('已被临时锁定');
    });
  });

  describe('cleanupExpiredCodes', () => {
    it('should delete expired verification codes', async () => {
      await cleanupExpiredCodes();

      expect(prisma.verificationCode.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });
  });
});
