import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, I18N_CONFIG } from '../config/env';

// 资源文件
const resources = {
  'zh-CN': {
    translation: require('./locales/zh-CN.json'),
  },
  en: {
    translation: require('./locales/en.json'),
  },
};

// 语言检测器
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // 1. 优先读取用户偏好
      const preference = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE);
      if (preference) {
        callback(preference);
        return;
      }
    } catch {
      // 忽略读取错误
    }

    // 2. 使用环境变量配置的语言，否则默认中文
    callback(I18N_CONFIG.DEFAULT_LANGUAGE || 'zh-CN');
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, language);
    } catch {
      // 忽略写入错误
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: I18N_CONFIG.DEFAULT_LANGUAGE || 'zh-CN',
    fallbackLng: 'zh-CN',
    debug: __DEV__,
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false, // React Native 不需要 HTML 转义
    },
    react: {
      useSuspense: false, // 在 React Native 中禁用 Suspense 以避免闪屏
    },
  });

export default i18n;
