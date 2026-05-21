import { apiService } from '../infrastructure/api';

export enum AppleAuthErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  USER_CANCELLED = 'USER_CANCELLED',
  MODULE_NOT_AVAILABLE = 'MODULE_NOT_AVAILABLE',
}

export interface AppleAuthResult {
  success: boolean;
  code?: string;
  idToken?: string;
  userId?: string;
  email?: string;
  error?: string;
  errorCode?: AppleAuthErrorCode;
}

export interface AppleUser {
  id: string;
  email: string;
  isPrivateEmail: boolean;
}

export class AppleAuthService {
  private static instance: AppleAuthService;

  private constructor() {}

  public static getInstance(): AppleAuthService {
    if (!AppleAuthService.instance) {
      AppleAuthService.instance = new AppleAuthService();
    }
    return AppleAuthService.instance;
  }

  public async login(): Promise<AppleAuthResult> {
    try {
      const supported = await this.isSupported();
      if (!supported) {
        return {
          success: false,
          error: '当前设备不支持 Apple 登录',
          errorCode: AppleAuthErrorCode.NOT_SUPPORTED,
        };
      }

      const credential = await this.performAppleLogin();

      if (!credential) {
        return {
          success: false,
          error: '获取 Apple 授权失败',
          errorCode: AppleAuthErrorCode.AUTH_FAILED,
        };
      }

      return {
        success: true,
        code: credential.authorizationCode,
        idToken: credential.identityToken,
        userId: credential.userId,
        email: credential.email,
      };
    } catch (error: any) {
      const errorCode = this.mapErrorCode(error.code);
      return {
        success: false,
        error: error.message || 'Apple 登录失败',
        errorCode,
      };
    }
  }

  public async isSupported(): Promise<boolean> {
    try {
      const { Platform } = await import('react-native');
      const isSupported = Platform.OS === 'ios' && parseFloat(Platform.Version) >= 13;

      if (!isSupported && Platform.OS !== 'ios') {
        console.warn('Apple Sign In is only available on iOS');
      }

      return isSupported;
    } catch {
      return false;
    }
  }

  public async performAppleLogin(): Promise<{
    userId: string;
    authorizationCode?: string;
    identityToken?: string;
    email?: string;
  }> {
    const { Platform } = await import('react-native');

    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    const expoAppleAuth = await tryImportExpoAppleAuth();
    if (expoAppleAuth) {
      const credential = await expoAppleAuth.signInAsync({
        requestedScopes: [
          expoAppleAuth.AppleAuthenticationScope.FULL_NAME,
          expoAppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });

      return {
        userId: credential.user,
        authorizationCode: credential.authorizationCode ?? undefined,
        identityToken: credential.identityToken ?? undefined,
        email: credential.email ?? undefined,
      };
    }

    const nativeAppleAuth = await tryImportNativeAppleAuth();
    if (nativeAppleAuth) {
      const credential = await nativeAppleAuth.performRequest({
        requestedOperation: nativeAppleAuth.Operation.LOGIN,
        requestedScopes: [nativeAppleAuth.Scope.EMAIL, nativeAppleAuth.Scope.FULL_NAME],
      });

      return {
        userId: credential.user,
        authorizationCode: credential.authorizationCode,
        identityToken: credential.identityToken,
        email: credential.email,
      };
    }

    throw new Error('Apple Authentication module not available');
  }

  public async getAppleUserInfo(idToken: string): Promise<AppleUser | null> {
    try {
      const response: any = await apiService.post('/auth/apple', { idToken });
      if (response && response.data) {
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  private mapErrorCode(code: string | undefined): AppleAuthErrorCode {
    if (!code) return AppleAuthErrorCode.AUTH_FAILED;

    if (code === 'ERR_CANCELED' || code === 'ERR_REQUEST_CANCELED') {
      return AppleAuthErrorCode.USER_CANCELLED;
    }

    if (code.includes('NOT_AVAILABLE') || code.includes('MODULE')) {
      return AppleAuthErrorCode.MODULE_NOT_AVAILABLE;
    }

    return AppleAuthErrorCode.AUTH_FAILED;
  }
}

async function tryImportExpoAppleAuth(): Promise<any | null> {
  try {
    return await import('expo-apple-authentication');
  } catch {
    return null;
  }
}

async function tryImportNativeAppleAuth(): Promise<any | null> {
  try {
    // @ts-ignore: Dynamic import of optional native module
    const module = await import('@invertase/react-native-apple-authentication').catch(() => null);
    if (module && module.appleAuth) {
      return module.appleAuth;
    }
    return null;
  } catch {
    return null;
  }
}

export const appleAuthService = AppleAuthService.getInstance();
