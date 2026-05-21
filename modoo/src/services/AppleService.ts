import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export interface AppleUserInfo {
  userId: string;
  email?: string;
  fullName?: {
    givenName?: string;
    familyName?: string;
    nickname?: string;
  };
  identityToken?: string;
  authorizationCode?: string;
}

export interface AppleAuthResult {
  userInfo: AppleUserInfo;
  credentialState: 'notFound' | 'revoked' | 'authorized';
}

class AppleService {
  private static instance: AppleService;

  private constructor() {}

  static getInstance(): AppleService {
    if (!AppleService.instance) {
      AppleService.instance = new AppleService();
    }
    return AppleService.instance;
  }

  isAvailable(): boolean {
    return Platform.OS === 'ios';
  }

  async login(): Promise<AppleUserInfo> {
    if (!this.isAvailable()) {
      throw new Error('Apple Sign In is only available on iOS');
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      return {
        userId: credential.user,
        email: credential.email ?? undefined,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName ?? undefined,
              familyName: credential.fullName.familyName ?? undefined,
              nickname: credential.fullName.nickname ?? undefined,
            }
          : undefined,
        identityToken: credential.identityToken ?? undefined,
        authorizationCode: credential.authorizationCode ?? undefined,
      };
    } catch (error) {
      if ((error as any).code === 'ERR_CANCELED') {
        throw new Error('User cancelled Apple Sign In');
      }
      if ((error as any).code === 'ERR_INVALID_OPERATION') {
        throw new Error('Apple Sign In is not available on this device');
      }
      throw error;
    }
  }

  async getCredentialState(userId: string): Promise<'notFound' | 'revoked' | 'authorized'> {
    try {
      const state = await AppleAuthentication.getCredentialStateAsync(userId);

      switch (state) {
        case AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND:
          return 'notFound';
        case AppleAuthentication.AppleAuthenticationCredentialState.REVOKED:
          return 'revoked';
        case AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED:
          return 'authorized';
        default:
          return 'notFound';
      }
    } catch {
      return 'notFound';
    }
  }

  async checkAvailability(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }
}

export const appleService = AppleService.getInstance();
