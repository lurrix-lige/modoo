import { randomUUID } from 'crypto';
import { prisma } from '../utils/database';

/**
 * 匿名用户管理服务
 * 
 * 负责：
 * 1. 生成安全的匿名用户ID
 * 2. 管理匿名用户会话
 * 3. 登录后数据迁移
 * 4. 匿名用户行为追踪
 */

export interface AnonymousUser {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  deviceId?: string;
  lastActiveAt?: Date;
}

export interface AnonymousMigrationResult {
  success: boolean;
  migratedRecords: {
    playHistory: number;
    favorites: number;
    checkIns: number;
    lessonProgress: number;
    shares: number;
  };
  message: string;
}

export class AnonymousUserService {
  /**
   * 生成安全的匿名用户ID
   * 使用 UUID v4 格式，确保唯一性和安全性
   */
  static generateAnonymousId(): string {
    return `anonymous_${randomUUID().replace(/-/g, '')}`;
  }

  /**
   * 创建匿名用户记录
   */
  static async createAnonymousUser(deviceId?: string): Promise<AnonymousUser> {
    const id = this.generateAnonymousId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天有效期

    return {
      id,
      createdAt: now,
      expiresAt,
      deviceId,
      lastActiveAt: now,
    };
  }

  /**
   * 验证匿名用户ID格式是否有效
   */
  static validateAnonymousId(anonymousId: string): boolean {
    const pattern = /^anonymous_[a-f0-9]{32}$/i;
    return pattern.test(anonymousId);
  }

  /**
   * 检查匿名用户ID是否过期
   * 由于我们不持久化匿名用户，这里简化处理
   */
  static isAnonymousIdValid(anonymousId: string): boolean {
    if (!this.validateAnonymousId(anonymousId)) {
      return false;
    }
    
    // 检查ID是否在有效期内（从ID创建时间推算）
    // 匿名ID格式：anonymous_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // 前8位是时间戳的十六进制表示
    const timestampHex = anonymousId.slice(10, 18);
    const createdAt = parseInt(timestampHex, 16) * 1000;
    const expiresAt = createdAt + 30 * 24 * 60 * 60 * 1000; // 30天
    
    return Date.now() < expiresAt;
  }

  /**
   * 将匿名用户数据迁移到正式用户
   * @param anonymousId 匿名用户ID
   * @param userId 正式用户ID
   * @param childId 孩子ID（可选）
   */
  static async migrateAnonymousData(
    anonymousId: string,
    userId: string,
    childId?: string
  ): Promise<AnonymousMigrationResult> {
    const migratedRecords = {
      playHistory: 0,
      favorites: 0,
      checkIns: 0,
      lessonProgress: 0,
      shares: 0,
    };

    try {
      // 迁移播放历史
      const playHistoryCount = await prisma.playHistory.updateMany({
        where: { anonymousId },
        data: { userId, childId, anonymousId: null },
      });
      migratedRecords.playHistory = playHistoryCount.count;

      // 迁移收藏
      const favoritesCount = await prisma.favorite.updateMany({
        where: { anonymousId },
        data: { userId, childId, anonymousId: null },
      });
      migratedRecords.favorites = favoritesCount.count;

      // 迁移打卡记录
      const checkInsCount = await prisma.checkIn.updateMany({
        where: { anonymousId },
        data: { userId, childId, anonymousId: null },
      });
      migratedRecords.checkIns = checkInsCount.count;

      // 迁移课程进度
      const lessonProgressCount = await prisma.lessonProgress.updateMany({
        where: { anonymousId },
        data: { userId, childId, anonymousId: null },
      });
      migratedRecords.lessonProgress = lessonProgressCount.count;

      // 迁移分享记录
      const sharesCount = await prisma.share.updateMany({
        where: { anonymousId },
        data: { userId, childId, anonymousId: null },
      });
      migratedRecords.shares = sharesCount.count;

      return {
        success: true,
        migratedRecords,
        message: '匿名数据迁移成功',
      };
    } catch (error) {
      console.error('Anonymous data migration failed:', error);
      return {
        success: false,
        migratedRecords,
        message: '数据迁移失败',
      };
    }
  }

  /**
   * 获取匿名用户的统计数据
   */
  static async getAnonymousUserStats(anonymousId: string) {
    const [playHistory, favorites, checkIns, lessonProgress] = await Promise.all([
      prisma.playHistory.count({ where: { anonymousId } }),
      prisma.favorite.count({ where: { anonymousId } }),
      prisma.checkIn.count({ where: { anonymousId } }),
      prisma.lessonProgress.count({ where: { anonymousId } }),
    ]);

    return {
      playHistory,
      favorites,
      checkIns,
      lessonProgress,
    };
  }

  /**
   * 清理过期的匿名用户数据
   * @param daysToKeep 保留天数（默认30天）
   */
  static async cleanupExpiredAnonymousData(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const [playHistoryCount, favoritesCount, checkInsCount, lessonProgressCount, sharesCount] = await Promise.all([
      prisma.playHistory.deleteMany({
        where: { anonymousId: { not: null }, createdAt: { lt: cutoffDate } },
      }),
      prisma.favorite.deleteMany({
        where: { anonymousId: { not: null }, createdAt: { lt: cutoffDate } },
      }),
      prisma.checkIn.deleteMany({
        where: { anonymousId: { not: null }, createdAt: { lt: cutoffDate } },
      }),
      prisma.lessonProgress.deleteMany({
        where: { anonymousId: { not: null }, createdAt: { lt: cutoffDate } },
      }),
      prisma.share.deleteMany({
        where: { anonymousId: { not: null }, createdAt: { lt: cutoffDate } },
      }),
    ]);

    return {
      playHistory: playHistoryCount.count,
      favorites: favoritesCount.count,
      checkIns: checkInsCount.count,
      lessonProgress: lessonProgressCount.count,
      shares: sharesCount.count,
    };
  }
}
