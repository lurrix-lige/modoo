import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import i18n from '../../i18n';
import { storageService } from '../storage/StorageService';
import { AUTH_CONFIG, STORAGE_KEYS } from '../../config/env';
import { logger } from '../../utils/logger';

const { TOKEN_EXPIRY_BUFFER, SESSION_TIMEOUT, CHECK_INTERVAL, ACTIVITY_THROTTLE_MS } = AUTH_CONFIG;

let apiServiceInstance: any = null;

async function getApiService() {
  if (!apiServiceInstance) {
    const { apiService } = await import('../api/ApiService');
    apiServiceInstance = apiService;
  }
  return apiServiceInstance;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface StoredUser {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

interface StoredChild {
  id: string;
  nickname: string;
  birthday: string;
  gender: 'male' | 'female';
  guardianSpiritId?: string;
  sleepProblems: string[];
  createdAt: string;
}

type AuthCallback = () => void;

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private lastActivityAt: number = 0;
  private lastRecordedActivityAt: number = 0; // 用于节流
  private refreshPromise: Promise<string> | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private onSessionTimeout: AuthCallback | null = null;
  private onTokenRefreshed: AuthCallback | null = null;
  private isPaid: boolean = false;

  async initialize(): Promise<boolean> {
    try {
      // 使用 safeGetItem 包装每个存储读取，防止单个失败导致整体初始化崩溃
      const safeSecureGet = async (key: string): Promise<string | null> => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch {
          return null;
        }
      };
      const safeAsyncGet = async (key: string): Promise<string | null> => {
        try {
          return await AsyncStorage.getItem(key);
        } catch {
          return null;
        }
      };

      const [accessToken, refreshToken, expiresAtStr, lastActivityStr, isPaidStr, user] =
        await Promise.all([
          safeSecureGet(STORAGE_KEYS.ACCESS_TOKEN),
          safeSecureGet(STORAGE_KEYS.REFRESH_TOKEN),
          safeSecureGet(STORAGE_KEYS.TOKEN_EXPIRES_AT),
          safeAsyncGet(STORAGE_KEYS.LAST_ACTIVITY_AT),
          safeAsyncGet(STORAGE_KEYS.IS_PAID),
          storageService.getUser().catch(() => null),
        ]);

      if (accessToken && expiresAtStr) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = parseInt(expiresAtStr, 10);
        this.lastActivityAt = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
        this.isPaid = isPaidStr === 'true';
      }

      this.startSessionCheck();

      return !!accessToken && !!user;
    } catch (error) {
      logger.error('Failed to initialize auth', { error });
      return false;
    }
  }

  async checkPaidStatus(): Promise<boolean> {
    try {
      const apiService = await getApiService();
      const data = await apiService.getCurrentMembership();
      this.isPaid = data?.active || data?.isPaid || false;
      await AsyncStorage.setItem(STORAGE_KEYS.IS_PAID, this.isPaid.toString());
      return this.isPaid;
    } catch {
      return this.isPaid;
    }
  }

  getPaidStatus(): boolean {
    return this.isPaid;
  }

  async setPaidStatus(isPaid: boolean): Promise<void> {
    this.isPaid = isPaid;
    await AsyncStorage.setItem(STORAGE_KEYS.IS_PAID, isPaid.toString());
  }

  setCallbacks(onSessionTimeout: AuthCallback, onTokenRefreshed: AuthCallback): void {
    this.onSessionTimeout = onSessionTimeout;
    this.onTokenRefreshed = onTokenRefreshed;
  }

  /**
   * 记录用户活动，带有节流机制避免频繁更新
   * @param force 是否强制记录（忽略节流）
   */
  recordActivity(force: boolean = false): void {
    const now = Date.now();
    if (force || now - this.lastRecordedActivityAt >= ACTIVITY_THROTTLE_MS) {
      this.lastActivityAt = now;
      this.lastRecordedActivityAt = now;
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_AT, now.toString());

      this.tryRefreshTokenOnActivity();
    }
  }

  private async tryRefreshTokenOnActivity(): Promise<void> {
    if (this.isTokenExpiringSoon() && this.refreshToken && !this.refreshPromise) {
      try {
        await this.refreshAccessToken();
      } catch {
        // 刷新失败不影响用户操作，后续会在请求时处理
      }
    }
  }

  isAuthenticated(): boolean {
    if (!this.accessToken) return false;
    if (Date.now() >= this.tokenExpiresAt) return false;
    if (this.isSessionTimedOut()) return false;
    return true;
  }

  isSessionTimedOut(): boolean {
    return Date.now() - this.lastActivityAt > SESSION_TIMEOUT;
  }

  isTokenExpiringSoon(): boolean {
    return Date.now() > this.tokenExpiresAt - TOKEN_EXPIRY_BUFFER;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  async setTokens(tokens: AuthTokens): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiresAt = tokens.expiresAt;
    this.lastActivityAt = Date.now();

    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      SecureStore.setItemAsync(STORAGE_KEYS.TOKEN_EXPIRES_AT, tokens.expiresAt.toString()),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY_AT, this.lastActivityAt.toString()),
    ]);
  }

  async setUser(user: StoredUser): Promise<void> {
    await storageService.saveUser(user);
  }

  async getUser(): Promise<StoredUser | null> {
    return await storageService.getUser();
  }

  async setChild(child: StoredChild): Promise<void> {
    await storageService.saveChild(child);
  }

  async getChild(): Promise<StoredChild | null> {
    return await storageService.getChild();
  }

  async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error(i18n.t('auth.noRefreshToken'));
    }

    this.refreshPromise = this.doRefreshToken();
    try {
      const newToken = await this.refreshPromise;
      this.recordActivity();
      this.onTokenRefreshed?.();
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefreshToken(): Promise<string> {
    try {
      const apiService = await getApiService();
      const data = await apiService.post('/auth/refresh', { refreshToken: this.refreshToken });

      await this.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || this.refreshToken!,
        expiresAt: Date.now() + data.expiresIn * 1000,
      });

      return data.accessToken;
    } catch (error) {
      await this.clearAuth();
      throw error;
    }
  }

  async clearAuth(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = 0;
    this.lastActivityAt = 0;
    this.isPaid = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN_EXPIRES_AT),
      AsyncStorage.multiRemove([STORAGE_KEYS.LAST_ACTIVITY_AT, STORAGE_KEYS.IS_PAID]),
    ]);

    await storageService.clearAll();
  }

  async getValidToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    if (this.isSessionTimedOut()) {
      await this.clearAuth();
      this.onSessionTimeout?.();
      return null;
    }

    if (this.isTokenExpiringSoon()) {
      try {
        return await this.refreshAccessToken();
      } catch {
        this.onSessionTimeout?.();
        return null;
      }
    }

    return this.accessToken;
  }

  private startSessionCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      if (!this.accessToken) return;

      if (this.isSessionTimedOut()) {
        await this.clearAuth();
        this.onSessionTimeout?.();
        return;
      }

      if (this.isTokenExpiringSoon() && this.refreshToken) {
        try {
          await this.refreshAccessToken();
        } catch {
          this.onSessionTimeout?.();
        }
      }
    }, CHECK_INTERVAL);
  }

  async login(phone: string, code: string): Promise<StoredUser> {
    const apiService = await getApiService();
    const data = await apiService.post('/auth/login', { phone, code });

    await this.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    });

    const user: StoredUser = {
      id: data.user.id,
      phone: data.user.phone,
      nickname: data.user.nickname,
      avatar: data.user.avatar,
      createdAt: data.user.createdAt,
    };

    await this.setUser(user);
    this.startSessionCheck();

    // 异步迁移匿名用户数据（不阻塞登录流程）
    this.migrateAnonymousData();

    return user;
  }

  /**
   * 迁移匿名用户数据到正式用户
   */
  private async migrateAnonymousData(): Promise<void> {
    try {
      const anonymousId = await storageService.getAnonymousId();
      if (anonymousId) {
        const apiService = await getApiService();
        const result = await apiService.migrateAnonymousData(anonymousId);
        logger.info('Anonymous data migrated successfully', { migratedRecords: result.data });
      }
    } catch (error) {
      logger.warn('Failed to migrate anonymous data', { error });
      // 迁移失败不影响登录流程，数据可以稍后再迁移
    }
  }

  async sendVerificationCode(phone: string): Promise<void> {
    const apiService = await getApiService();
    await apiService.post('/auth/send-code', { phone });
  }

  async register(phone: string, code: string): Promise<StoredUser> {
    const apiService = await getApiService();
    const data = await apiService.post('/auth/register', { phone, code });

    await this.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    });

    const user: StoredUser = {
      id: data.user.id,
      phone: data.user.phone,
      nickname: data.user.nickname,
      avatar: data.user.avatar,
      createdAt: data.user.createdAt,
    };

    await this.setUser(user);
    this.startSessionCheck();

    return user;
  }

  async logout(): Promise<void> {
    try {
      const apiService = await getApiService();
      await apiService.post('/auth/logout');
    } catch {
      // Logout API failure is non-critical; clear local auth state regardless
    }
    await this.clearAuth();
  }

  async appleLogin(authorizationCode: string, identityToken: string): Promise<StoredUser> {
    const apiService = await getApiService();
    const data = await apiService.post('/auth/apple', { authorizationCode, identityToken });

    await this.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    });

    const user: StoredUser = {
      id: data.user.id,
      phone: data.user.phone || '',
      nickname: data.user.nickname || 'Apple User',
      avatar: data.user.avatar || data.appleAvatar,
      createdAt: data.user.createdAt,
    };

    await this.setUser(user);
    this.startSessionCheck();

    // 异步迁移匿名用户数据（不阻塞登录流程）
    this.migrateAnonymousData();

    return user;
  }

  async wechatLogin(code: string): Promise<StoredUser> {
    const apiService = await getApiService();
    const data = await apiService.post('/auth/wechat', { code });

    await this.setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    });

    const user: StoredUser = {
      id: data.user.id,
      phone: data.user.phone || '',
      nickname: data.user.nickname || data.wechatNickname || 'WeChat User',
      avatar: data.user.avatar || data.wechatAvatar,
      createdAt: data.user.createdAt,
    };

    await this.setUser(user);
    this.startSessionCheck();

    // 异步迁移匿名用户数据（不阻塞登录流程）
    this.migrateAnonymousData();

    return user;
  }
}

export const authService = new AuthService();
export type { StoredUser, StoredChild };
