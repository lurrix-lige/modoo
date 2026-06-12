import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { Story } from '../../types';
import { logger } from '../../utils/logger';

// 🔐 密钥分类 - 区分敏感和非敏感数据
const SECURE_KEYS = {
  AUTH_TOKEN: 'dozoo_token',
  USER: 'dozoo_user',
} as const;

const STORAGE_KEYS = {
  ...SECURE_KEYS,
  CHILD: 'dozoo_child',
  THEME_MODE: 'dozoo_theme_mode',
  PLAY_HISTORY: 'dozoo_play_history',
  CHECK_IN_RECORD: 'dozoo_check_in',
  COURSE_PROGRESS: 'dozoo_course_progress',
  COURSE_CACHE: 'dozoo_course_cache',
  COURSE_VOLUME_SETTINGS: 'dozoo_course_volume',
  COURSE_PLAYBACK_PROGRESS: 'dozoo_course_playback',
  CACHE: 'dozoo_cache',
  CACHE_STORIES: 'dozoo_cache_stories',
  CACHE_ARTICLES: 'dozoo_cache_articles',
  ANONYMOUS_ID: 'dozoo_anonymous_id',
};

const CACHE_TTL = {
  SHORT: 30 * 60 * 1000,
  MEDIUM: 2 * 60 * 60 * 1000,
  LONG: 24 * 60 * 60 * 1000,
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PlayHistoryItem {
  storyId: string;
  progress: number;
  completed: boolean;
  lastPlayedAt: string;
}

interface CheckInRecord {
  date: string;
  sleepTime: string;
  wakeTime: string;
  quality: number;
}

/**
 * 检测 SecureStore 是否可用（仅 iOS 和 Android 支持）
 */
const isSecureStoreAvailable = (): boolean => {
  // Web 平台不支持 expo-secure-store
  if (Platform.OS === 'web') {
    return false;
  }
  // 检查 SecureStore.getItemAsync 是否存在
  try {
    return typeof SecureStore.getItemAsync === 'function';
  } catch {
    return false;
  }
};

const secureStoreAvailable = isSecureStoreAvailable();

/**
 * 🔐 安全存储适配器
 * - iOS/Android: 使用 expo-secure-store
 * - Web: 降级到 AsyncStorage
 */
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (secureStoreAvailable) {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch (error) {
        logger.warn('SecureStore setItem failed, falling back to AsyncStorage', { error });
      }
    }
    // 降级到 AsyncStorage
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    if (secureStoreAvailable) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        logger.warn('SecureStore getItem failed, falling back to AsyncStorage', { error });
      }
    }
    // 降级到 AsyncStorage
    return await AsyncStorage.getItem(key);
  },

  async deleteItem(key: string): Promise<void> {
    if (secureStoreAvailable) {
      try {
        await SecureStore.deleteItemAsync(key);
        return;
      } catch (error) {
        logger.warn('SecureStore deleteItem failed, falling back to AsyncStorage', { error });
      }
    }
    // 降级到 AsyncStorage
    await AsyncStorage.removeItem(key);
  },
};

/**
 * 💾 存储服务
 * - 敏感数据（token、用户）使用安全存储
 * - 普通数据使用AsyncStorage
 */
class StorageService {
  // ==============================================
  // 🔐 敏感数据存储方法
  // ==============================================

  /**
   * 保存认证Token
   */
  async saveAuthToken(token: string): Promise<void> {
    try {
      await secureStorage.setItem(SECURE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      logger.error('Failed to save auth token', { error });
    }
  }

  /**
   * 获取认证Token
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return await secureStorage.getItem(SECURE_KEYS.AUTH_TOKEN);
    } catch (error) {
      logger.error('Failed to get auth token', { error });
      return null;
    }
  }

  /**
   * 删除认证Token
   */
  async deleteAuthToken(): Promise<void> {
    try {
      await secureStorage.deleteItem(SECURE_KEYS.AUTH_TOKEN);
    } catch (error) {
      logger.error('Failed to delete auth token', { error });
    }
  }

  /**
   * 保存用户数据
   */
  async saveUser(user: any): Promise<void> {
    try {
      await secureStorage.setItem(SECURE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      logger.error('Failed to save user', { error });
    }
  }

  /**
   * 获取用户数据
   * 如果查不到用户，返回 null（使用匿名用户）
   */
  async getUser(): Promise<any | null> {
    try {
      const data = await secureStorage.getItem(SECURE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // 查不到用户是正常情况，使用匿名用户，不报错
      logger.warn('User not found in storage, will use anonymous mode', { error });
      return null;
    }
  }

  // ==============================================
  // 🕵️ 匿名用户ID管理
  // ==============================================

  /**
   * 生成本地匿名用户ID（降级方案）
   */
  private generateLocalAnonymousId(): string {
    let uuid: string;
    
    // 优先使用 expo-crypto 的 randomUUID
    try {
      uuid = Crypto.randomUUID().replace(/-/g, '');
    } catch {
      // 降级方案：使用时间戳 + 随机数生成唯一ID
      uuid = this.fallbackUuidGenerator();
    }
    
    return `anonymous_${uuid}`;
  }

  /**
   * 备用UUID生成器（当 Crypto.randomUUID 不可用时使用）
   */
  private fallbackUuidGenerator(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const random2 = Math.random().toString(36).substring(2, 15);
    return `${timestamp}${random}${random2}`.substring(0, 32);
  }

  /**
   * 获取或创建匿名用户ID（优先使用后端API）
   */
  async getOrCreateAnonymousId(): Promise<string> {
    try {
      let anonymousId = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);

      if (!anonymousId) {
        // 优先使用后端API生成匿名ID
        try {
          const { apiService } = await import('../api/ApiService');
          const result = await apiService.generateAnonymousId();
          anonymousId = result.anonymousId;
          await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, anonymousId);
          logger.info('Anonymous ID generated from backend', { anonymousId });
        } catch (apiError) {
          // 后端API调用失败，降级使用本地生成
          logger.warn('Failed to get anonymous ID from backend, falling back to local generation', {
            apiError,
          });
          anonymousId = this.generateLocalAnonymousId();
          await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, anonymousId);
        }
      } else {
        // 验证现有匿名ID是否有效
        try {
          const { apiService } = await import('../api/ApiService');
          const validation = await apiService.validateAnonymousId(anonymousId);
          // 验证失败或ID无效，重新生成
          if (!validation || !validation.isValidAndActive) {
            const result = await apiService.generateAnonymousId();
            // 添加空值检查
            if (result && result.anonymousId) {
              anonymousId = result.anonymousId;
              await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, anonymousId);
              logger.info('Anonymous ID refreshed due to expiration', { anonymousId });
            }
            // 如果API返回无效数据，继续使用现有ID
          }
        } catch (validationError) {
          // 验证失败，继续使用现有ID
          logger.warn('Failed to validate anonymous ID', { validationError });
        }
      }

      return anonymousId;
    } catch (error) {
      logger.error('Failed to get or create anonymous ID', { error });
      return this.generateLocalAnonymousId();
    }
  }

  /**
   * 获取匿名用户ID（如果存在）
   */
  async getAnonymousId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
    } catch (error) {
      logger.error('Failed to get anonymous ID', { error });
      return null;
    }
  }

  // ==============================================
  // 📦 普通数据存储方法
  // ==============================================

  private async getCacheEntry<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;

      if (isExpired) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      logger.error('Failed to get cache entry', { error });
      return null;
    }
  }

  private async setCacheEntry<T>(
    key: string,
    data: T,
    ttl: number = CACHE_TTL.MEDIUM,
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      logger.error('Failed to set cache entry', { error });
    }
  }

  async saveChild(child: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHILD, JSON.stringify(child));
    } catch (error) {
      logger.error('Failed to save child', { error });
    }
  }

  async getChild(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHILD);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get child', { error });
      return null;
    }
  }

  async saveStoriesCache(stories: Story[]): Promise<void> {
    await this.setCacheEntry(STORAGE_KEYS.CACHE_STORIES, stories, CACHE_TTL.LONG);
  }

  async getStoriesCache(): Promise<Story[] | null> {
    return await this.getCacheEntry<Story[]>(STORAGE_KEYS.CACHE_STORIES);
  }

  async saveArticlesCache(articles: any[]): Promise<void> {
    await this.setCacheEntry(STORAGE_KEYS.CACHE_ARTICLES, articles, CACHE_TTL.MEDIUM);
  }

  async getArticlesCache(): Promise<any[] | null> {
    return await this.getCacheEntry<any[]>(STORAGE_KEYS.CACHE_ARTICLES);
  }

  async savePlayHistory(storyId: string, progress: number, completed: boolean): Promise<void> {
    try {
      const history = await this.getPlayHistory();
      const existingIndex = history.findIndex((item) => item.storyId === storyId);

      const newItem: PlayHistoryItem = {
        storyId,
        progress,
        completed,
        lastPlayedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        history[existingIndex] = newItem;
      } else {
        history.push(newItem);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.PLAY_HISTORY, JSON.stringify(history));
    } catch (error) {
      logger.error('Failed to save play history', { error });
    }
  }

  async getPlayHistory(): Promise<PlayHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Failed to get play history', { error });
      return [];
    }
  }

  async getStoryProgress(storyId: string): Promise<PlayHistoryItem | null> {
    const history = await this.getPlayHistory();
    return history.find((item) => item.storyId === storyId) || null;
  }

  async saveCheckIn(record: CheckInRecord): Promise<void> {
    try {
      const records = await this.getCheckInRecords();
      const existingIndex = records.findIndex((item) => item.date === record.date);

      if (existingIndex >= 0) {
        records[existingIndex] = record;
      } else {
        records.push(record);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CHECK_IN_RECORD, JSON.stringify(records));
    } catch (error) {
      logger.error('Failed to save check-in', { error });
    }
  }

  async getCheckInRecords(): Promise<CheckInRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHECK_IN_RECORD);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Failed to get check-in records', { error });
      return [];
    }
  }

  async getCheckInStreak(): Promise<number> {
    const records = await this.getCheckInRecords();
    if (records.length === 0) return 0;

    const sortedDates = records
      .map((r) => r.date)
      .sort()
      .reverse();
    const today = new Date().toISOString().split('T')[0];

    let streak = 0;
    let currentDate = new Date(today);

    for (const dateStr of sortedDates) {
      const checkDate = new Date(dateStr);
      const diffDays = Math.floor(
        (currentDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays <= 1) {
        streak++;
        currentDate = checkDate;
      } else {
        break;
      }
    }

    return streak;
  }

  async saveThemeMode(mode: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (error) {
      logger.error('Failed to save theme mode', { error });
    }
  }

  async getThemeMode(): Promise<'light' | 'dark' | 'system'> {
    try {
      const mode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      return (mode as any) || 'system';
    } catch (error) {
      logger.error('Failed to get theme mode', { error });
      return 'system';
    }
  }

  async saveCourseProgress(level: number, progress: number): Promise<void> {
    try {
      const allProgress = await this.getCourseProgress();
      allProgress[level] = progress;
      await AsyncStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(allProgress));
    } catch (error) {
      logger.error('Failed to save course progress', { error });
    }
  }

  async getCourseProgress(): Promise<Record<number, number>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COURSE_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      logger.error('Failed to get course progress', { error });
      return {};
    }
  }

  async saveCoursesCache(courses: any[]): Promise<void> {
    await this.setCacheEntry(STORAGE_KEYS.COURSE_CACHE, courses, CACHE_TTL.MEDIUM);
  }

  async getCoursesCache(): Promise<any[] | null> {
    return await this.getCacheEntry<any[]>(STORAGE_KEYS.COURSE_CACHE);
  }

  async saveCourseVolumeSettings(settings: {
    backgroundVolume: number;
    voiceVolume: number;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COURSE_VOLUME_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      logger.error('Failed to save course volume settings', { error });
    }
  }

  async getCourseVolumeSettings(): Promise<{
    backgroundVolume: number;
    voiceVolume: number;
  } | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COURSE_VOLUME_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get course volume settings', { error });
      return null;
    }
  }

  async saveCoursePlaybackProgress(lessonId: string, progress: number): Promise<void> {
    try {
      const allProgress = (await this.getCoursePlaybackProgress()) as Record<
        string,
        { progress: number; lastPlayedAt: string }
      > | null;
      const progressData: Record<string, { progress: number; lastPlayedAt: string }> =
        allProgress && typeof allProgress === 'object' && !Array.isArray(allProgress)
          ? (allProgress as Record<string, { progress: number; lastPlayedAt: string }>)
          : {};
      progressData[lessonId] = {
        progress,
        lastPlayedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.COURSE_PLAYBACK_PROGRESS,
        JSON.stringify(progressData),
      );
    } catch (error) {
      logger.error('Failed to save course playback progress', { error });
    }
  }

  async getCoursePlaybackProgress(
    lessonId?: string,
  ): Promise<
    | Record<string, { progress: number; lastPlayedAt: string }>
    | { progress: number; lastPlayedAt: string }
    | null
  > {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COURSE_PLAYBACK_PROGRESS);
      if (!data) return null;

      const allProgress = JSON.parse(data);
      if (lessonId) {
        return allProgress[lessonId] || null;
      }
      return allProgress;
    } catch (error) {
      logger.error('Failed to get course playback progress', { error });
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CACHE_STORIES,
        STORAGE_KEYS.CACHE_ARTICLES,
        STORAGE_KEYS.CACHE,
      ]);
    } catch (error) {
      logger.error('Failed to clear cache', { error });
    }
  }

  async clearAll(): Promise<void> {
    try {
      // 清除敏感数据
      await secureStorage.deleteItem(SECURE_KEYS.AUTH_TOKEN);
      await secureStorage.deleteItem(SECURE_KEYS.USER);

      // 清除普通数据，但保留匿名ID以支持重新登录后数据迁移
      const keysToRemove = Object.values(STORAGE_KEYS).filter(
        (key) => key !== STORAGE_KEYS.ANONYMOUS_ID,
      );
      await AsyncStorage.multiRemove(keysToRemove);
    } catch (error) {
      logger.error('Failed to clear storage', { error });
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      let totalSize = 0;

      for (const key of keys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Failed to get storage size', { error });
      return 0;
    }
  }

  async clearOldData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        if (key.startsWith('dozoo_cache')) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            try {
              const entry = JSON.parse(data);
              if (Date.now() - entry.timestamp > 7 * 24 * 60 * 60 * 1000) {
                await AsyncStorage.removeItem(key);
              }
            } catch {
              // 忽略无效JSON
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to clear old data', { error });
    }
  }
}

export const storageService = new StorageService();
