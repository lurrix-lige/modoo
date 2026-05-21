import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/env';
import { logger } from '../utils/logger';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

// 可用语言列表
export const availableLanguages: LanguageOption[] = [
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language || 'zh-CN';

  const changeLanguage = useCallback(
    async (language: string) => {
      try {
        // 先尝试改变 i18n 语言
        await i18n.changeLanguage(language);

        // 然后持久化用户偏好
        await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, language);
      } catch (error) {
        logger.warn('Failed to change language', { error });
      }
    },
    [i18n],
  );

  // 检查是否支持该语言
  const isSupportedLanguage = useCallback(
    (code: string): boolean => availableLanguages.some((lang) => lang.code === code),
    [],
  );

  // 获取当前语言的详细信息
  const getCurrentLanguageInfo = useCallback(
    (): LanguageOption =>
      availableLanguages.find((lang) => lang.code === currentLanguage) || availableLanguages[0],
    [currentLanguage],
  );

  return {
    currentLanguage,
    availableLanguages,
    changeLanguage,
    isSupportedLanguage,
    getCurrentLanguageInfo,
  };
}
