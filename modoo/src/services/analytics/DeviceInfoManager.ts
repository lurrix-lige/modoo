import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { logger } from '../../utils/logger';

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  bundleId?: string;
  timezone?: string;
  locale?: string;
}

export class DeviceInfoManager {
  private static instance: DeviceInfoManager;
  private deviceInfo: DeviceInfo | null = null;

  private constructor() {}

  static getInstance(): DeviceInfoManager {
    if (!DeviceInfoManager.instance) {
      DeviceInfoManager.instance = new DeviceInfoManager();
    }
    return DeviceInfoManager.instance;
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.deviceInfo) {
      return this.deviceInfo;
    }

    this.deviceInfo = await this.collectDeviceInfo();
    return this.deviceInfo;
  }

  private async collectDeviceInfo(): Promise<DeviceInfo> {
    try {
      const platform = Platform.OS;
      const deviceModel = Device.modelName || undefined;
      const osVersion = Platform.Version?.toString() || undefined;
      const appVersion = Constants.expoConfig?.version;
      const bundleId = Constants.expoConfig?.slug;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const locale = this.getLocale();
      const deviceId = await this.getDeviceId();

      return {
        deviceId,
        platform,
        deviceModel,
        osVersion,
        appVersion,
        bundleId,
        timezone,
        locale,
      };
    } catch (error) {
      logger.warn('Failed to collect device info', { error });
      return this.getFallbackDeviceInfo();
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      if (Device.osVersion) {
        return `${Device.brand || 'unknown'}_${Device.modelName || 'unknown'}_${Date.now()}`;
      }
      throw new Error('Device info not available');
    } catch {
      return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private getLocale(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().locale;
    } catch {
      return 'en-US';
    }
  }

  private getFallbackDeviceInfo(): DeviceInfo {
    return {
      deviceId: `fallback_${Date.now()}`,
      platform: Platform.OS,
    };
  }

  getDeviceIdSync(): string {
    if (this.deviceInfo) {
      return this.deviceInfo.deviceId;
    }
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
