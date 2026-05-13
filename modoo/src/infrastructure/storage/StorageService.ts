import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '../../types';
import { logger } from '../../utils/logger';

// 🔐 密钥分类 - 区分敏感和非敏感数据
const SECURE_KEYS = {
  AUTH_TOKEN: '@dozoo_token',
  USER: '@dozoo_user',
} as const;

const STORAGE_KEYS = {
  ...SECURE_KEYS,
  CHILD: '@dozoo_child',
  THEME_MODE: '@dozoo_theme_mode',
  PLAY_HISTORY: '@dozoo_play_history',
  CHECK_IN_RECORD: '@dozoo_check_in',
  COURSE_PROGRESS: '@dozoo_course_progress',
  CACHE: '@dozoo_cache',
  CACHE_STORIES: '@dozoo_cache_stories',
  CACHE_ARTICLES: '@dozoo_cache_articles',
  ANONYMOUS_ID: '@dozoo_anonymous_id',
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
 * 🔐 安全存储适配器
 * 注意：需要安装 expo-secure-store 后启用
 * 运行: npx expo install expo-secure-store
 */
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    // TODO: 安装expo-secure-store后替换下面的代码
    // import * as SecureStore from 'expo-secure-store';
    // await SecureStore.setItemAsync(key, value);
    
    // 🚨 临时降级方案（不安全！）
    logger.warn('Using AsyncStorage for sensitive data - install expo-secure-store');
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    // TODO: 安装expo-secure-store后替换
    // return await SecureStore.getItemAsync(key);
    
    return await AsyncStorage.getItem(key);
  },

  async deleteItem(key: string): Promise<void> {
    // TODO: 安装expo-secure-store后替换
    // return await SecureStore.deleteItemAsync(key);
    
    return await AsyncStorage.removeItem(key);
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
   */
  async getUser(): Promise<any | null> {
    try {
      const data = await secureStorage.getItem(SECURE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get user', { error });
      return null;
    }
  }

  // ==============================================
  // 🕵️ 匿名用户ID管理
  // ==============================================
  
  /**
   * 生成匿名用户ID
   */
  private generateAnonymousId(): string {
    const randomStr = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    return `anonymous_${randomStr}`;
  }

  /**
   * 获取或创建匿名用户ID
   */
  async getOrCreateAnonymousId(): Promise<string> {
    try {
      let anonymousId = await AsyncStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
      
      if (!anonymousId) {
        anonymousId = this.generateAnonymousId();
        await AsyncStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, anonymousId);
      }
      
      return anonymousId;
    } catch (error) {
      logger.error('Failed to get or create anonymous ID', { error });
      return this.generateAnonymousId();
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

  private async setCacheEntry<T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
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
      const existingIndex = history.findIndex(item => item.storyId === storyId);

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
    return history.find(item => item.storyId === storyId) || null;
  }

  async saveCheckIn(record: CheckInRecord): Promise<void> {
    try {
      const records = await this.getCheckInRecords();
      const existingIndex = records.findIndex(item => item.date === record.date);

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

    const sortedDates = records.map(r => r.date).sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    let streak = 0;
    let currentDate = new Date(today);

    for (const dateStr of sortedDates) {
      const checkDate = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));

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
      
      // 清除普通数据
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
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
        if (key.startsWith('@dozoo_cache')) {
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
