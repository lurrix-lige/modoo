import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnonymousUserService } from '../AnonymousUserService';

vi.mock('../../utils/database', () => ({
  prisma: {
    playHistory: {
      updateMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    favorite: {
      updateMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    checkIn: {
      updateMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    lessonProgress: {
      updateMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    share: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../utils/database';

describe('AnonymousUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAnonymousId', () => {
    it('should generate ID with correct prefix', () => {
      const id = AnonymousUserService.generateAnonymousId();
      expect(id.startsWith('anonymous_')).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = AnonymousUserService.generateAnonymousId();
      const id2 = AnonymousUserService.generateAnonymousId();
      expect(id1).not.toBe(id2);
    });

    it('should generate 42-character ID (anonymous_ + 32 hex chars)', () => {
      const id = AnonymousUserService.generateAnonymousId();
      expect(id.length).toBe(42);
      expect(id).toMatch(/^anonymous_[a-f0-9]{32}$/);
    });
  });

  describe('validateAnonymousId', () => {
    it('should return true for valid ID', () => {
      const id = AnonymousUserService.generateAnonymousId();
      expect(AnonymousUserService.validateAnonymousId(id)).toBe(true);
    });

    it('should return false for invalid prefix', () => {
      expect(AnonymousUserService.validateAnonymousId('user_1234567890abcdef1234567890abcdef')).toBe(false);
    });

    it('should return false for wrong length', () => {
      expect(AnonymousUserService.validateAnonymousId('anonymous_tooshort')).toBe(false);
    });

    it('should return false for invalid hex chars', () => {
      expect(AnonymousUserService.validateAnonymousId('anonymous_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(false);
    });

    it('should accept uppercase hex chars', () => {
      const id = 'anonymous_' + 'A'.repeat(32);
      expect(AnonymousUserService.validateAnonymousId(id)).toBe(true);
    });
  });

  describe('createAnonymousUser', () => {
    it('should create anonymous user with 30-day expiry', async () => {
      const user = await AnonymousUserService.createAnonymousUser('device-1');

      expect(user.id.startsWith('anonymous_')).toBe(true);
      expect(user.deviceId).toBe('device-1');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.expiresAt).toBeInstanceOf(Date);
      const expiryMs = user.expiresAt.getTime() - user.createdAt.getTime();
      expect(expiryMs).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('should create anonymous user without deviceId', async () => {
      const user = await AnonymousUserService.createAnonymousUser();
      expect(user.deviceId).toBeUndefined();
      expect(user.lastActiveAt).toBeInstanceOf(Date);
    });
  });

  describe('isAnonymousIdValid', () => {
    it('should return false for malformed ID', () => {
      expect(AnonymousUserService.isAnonymousIdValid('bad-id')).toBe(false);
    });

    it('should return true for ID with valid timestamp', () => {
      // isAnonymousIdValid reads chars 10-18 as hex timestamp (seconds * 1000 → Date)
      const nowMs = Date.now();
      const tsHex = Math.floor(nowMs / 1000).toString(16).padStart(8, '0');
      const id = `anonymous_${tsHex}aaaaaaaaaaaaaaaaaaaaaaaa`;
      expect(AnonymousUserService.isAnonymousIdValid(id)).toBe(true);
    });

    it('should return false for ID with expired timestamp', () => {
      const oldMs = Date.now() - 2 * 365 * 24 * 3600 * 1000;
      const tsHex = Math.floor(oldMs / 1000).toString(16).padStart(8, '0');
      const id = `anonymous_${tsHex}aaaaaaaaaaaaaaaaaaaaaaaa`;
      expect(AnonymousUserService.isAnonymousIdValid(id)).toBe(false);
    });
  });

  describe('migrateAnonymousData', () => {
    it('should migrate all data types to registered user', async () => {
      vi.mocked(prisma.playHistory.updateMany).mockResolvedValue({ count: 10 } as any);
      vi.mocked(prisma.favorite.updateMany).mockResolvedValue({ count: 5 } as any);
      vi.mocked(prisma.checkIn.updateMany).mockResolvedValue({ count: 20 } as any);
      vi.mocked(prisma.lessonProgress.updateMany).mockResolvedValue({ count: 3 } as any);
      vi.mocked(prisma.share.updateMany).mockResolvedValue({ count: 2 } as any);

      const result = await AnonymousUserService.migrateAnonymousData('anon-1', 'user-1', 'child-1');

      expect(result.success).toBe(true);
      expect(result.migratedRecords.playHistory).toBe(10);
      expect(result.migratedRecords.favorites).toBe(5);
      expect(result.migratedRecords.checkIns).toBe(20);
      expect(result.migratedRecords.lessonProgress).toBe(3);
      expect(result.migratedRecords.shares).toBe(2);
    });

    it('should handle migration failure gracefully', async () => {
      vi.mocked(prisma.playHistory.updateMany).mockRejectedValue(new Error('DB error'));

      const result = await AnonymousUserService.migrateAnonymousData('anon-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('数据迁移失败');
    });
  });

  describe('getAnonymousUserStats', () => {
    it('should return counts for all data types', async () => {
      vi.mocked(prisma.playHistory.count).mockResolvedValue(10);
      vi.mocked(prisma.favorite.count).mockResolvedValue(5);
      vi.mocked(prisma.checkIn.count).mockResolvedValue(3);
      vi.mocked(prisma.lessonProgress.count).mockResolvedValue(7);

      const stats = await AnonymousUserService.getAnonymousUserStats('anon-1');

      expect(stats.playHistory).toBe(10);
      expect(stats.favorites).toBe(5);
      expect(stats.checkIns).toBe(3);
      expect(stats.lessonProgress).toBe(7);
    });
  });

  describe('cleanupExpiredAnonymousData', () => {
    it('should delete records older than specified days', async () => {
      vi.mocked(prisma.playHistory.deleteMany).mockResolvedValue({ count: 5 } as any);
      vi.mocked(prisma.favorite.deleteMany).mockResolvedValue({ count: 2 } as any);
      vi.mocked(prisma.checkIn.deleteMany).mockResolvedValue({ count: 3 } as any);
      vi.mocked(prisma.lessonProgress.deleteMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.share.deleteMany).mockResolvedValue({ count: 0 } as any);

      const result = await AnonymousUserService.cleanupExpiredAnonymousData(7);

      expect(prisma.playHistory.deleteMany).toHaveBeenCalledWith({
        where: { anonymousId: { not: null }, createdAt: { lt: expect.any(Date) } },
      });
      expect(result.playHistory).toBe(5);
      expect(result.favorites).toBe(2);
      expect(result.checkIns).toBe(3);
      expect(result.lessonProgress).toBe(1);
      expect(result.shares).toBe(0);
    });
  });
});
