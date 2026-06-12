import { Platform } from 'react-native';

let wechatModule: any = null;
let initialized = false;

function initWechat() {
  if (initialized) return;
  initialized = true;

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      wechatModule = require('react-native-wechat');
    } catch (e) {
      wechatModule = null;
    }
  }
}

export function getWechatModule(): any {
  initWechat();
  return wechatModule;
}

export function isWechatInstalled(): boolean {
  initWechat();
  if (!wechatModule) return false;
  try {
    return wechatModule.isWXAppInstalled();
  } catch {
    return false;
  }
}

export function getWechatAppId(): string {
  try {
    const { CONFIG } = require('../config/env');
    return CONFIG.wechat.APP_ID;
  } catch {
    return '';
  }
}
