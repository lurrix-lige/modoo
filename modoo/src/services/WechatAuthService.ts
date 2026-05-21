import { Platform, Alert } from 'react-native';
import { CONFIG } from '../config/env';

const WECHAT_APP_ID = CONFIG.wechat.APP_ID;

export interface WechatAuthResult {
  code: string;
  state?: string;
}

export class WechatAuthError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'WechatAuthError';
  }
}

class WechatAuthService {
  private static instance: WechatAuthService;
  private wechatModule: any = null;

  private constructor() {
    this.initWechat();
  }

  static getInstance(): WechatAuthService {
    if (!WechatAuthService.instance) {
      WechatAuthService.instance = new WechatAuthService();
    }
    return WechatAuthService.instance;
  }

  private initWechat() {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        this.wechatModule = require('react-native-wechat');
      } catch (e) {
        this.wechatModule = null;
      }
    }
  }

  isInstalled(): boolean {
    if (!this.wechatModule) return false;
    try {
      return this.wechatModule.isWXAppInstalled();
    } catch {
      return false;
    }
  }

  async checkAvailability(): Promise<boolean> {
    if (!this.isInstalled()) {
      return false;
    }

    if (!this.wechatModule) {
      return false;
    }

    try {
      const isSupported = await this.wechatModule.isSupportAPI();
      return isSupported;
    } catch {
      return false;
    }
  }

  async login(): Promise<WechatAuthResult> {
    if (!this.isInstalled()) {
      throw new WechatAuthError('未安装微信', 'NOT_INSTALLED');
    }

    const scope = 'snsapi_userinfo';
    const state = `wechat_${Date.now()}`;

    try {
      const result = await this.wechatModule.sendAuthRequest(scope, state);

      if (!result || !result.code) {
        throw new WechatAuthError('获取授权码失败', 'NO_CODE');
      }

      return {
        code: result.code,
        state: result.state,
      };
    } catch (error: any) {
      if (error.errCode === -2) {
        throw new WechatAuthError('用户取消授权', 'USER_CANCELLED');
      }
      if (error.errCode === -4) {
        throw new WechatAuthError('微信拒绝授权', 'AUTH_DENIED');
      }
      if (error.errCode === -5) {
        throw new WechatAuthError('微信版本不支持此功能', 'UNSUPPORTED');
      }
      throw new WechatAuthError(error.errStr || error.message || '微信授权失败', 'UNKNOWN');
    }
  }

  async getUserInfo(
    accessToken: string,
    openid: string,
  ): Promise<{
    nickname: string;
    avatar: string;
    unionid?: string;
  }> {
    if (!this.wechatModule) {
      throw new WechatAuthError('微信SDK未安装', 'SDK_NOT_FOUND');
    }

    try {
      const userInfo = await this.wechatModule.getUserInfo(accessToken, openid);

      return {
        nickname: userInfo.nickname || '微信用户',
        avatar: userInfo.headimgurl || '',
        unionid: userInfo.unionid,
      };
    } catch (error: any) {
      throw new WechatAuthError(
        error.errStr || error.message || '获取用户信息失败',
        'GET_USER_INFO_FAILED',
      );
    }
  }

  registerApp(): boolean {
    if (!this.wechatModule) {
      return false;
    }

    try {
      if (WECHAT_APP_ID) {
        this.wechatModule.registerApp(WECHAT_APP_ID);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const wechatAuthService = WechatAuthService.getInstance();
