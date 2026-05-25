import { GuardianIconType } from '../components/GuardianSpirit';
import { colors } from '../theme/colors';

export type GuardianSpiritId = 'moon' | 'firefly' | 'star';

export type ThemeMode = 'light' | 'dark';

/**
 * 精灵颜色配置接口
 * 为每种精灵定义 light 和 dark 模式下的专属颜色值
 */
export interface GuardianSpiritColors {
  light: string;
  dark: string;
}

/**
 * 守护精灵配置接口
 */
export interface GuardianSpiritConfig {
  id: GuardianSpiritId;
  nameKey: string;
  descriptionKey: string;
  icon: GuardianIconType;
  colors: GuardianSpiritColors;
  type: string;
  animationUrl?: string;
  personality?: string[];
  createdAt?: string;
}

/**
 * 守护精灵颜色配置映射表
 * 集中管理所有精灵的颜色配置，便于维护和扩展
 */
export const GUARDIAN_SPIRIT_COLORS: Record<GuardianSpiritId, GuardianSpiritColors> = {
  moon: {
    light: '#F28B6B',
    dark: '#C96B4B',
  },
  firefly: {
    light: '#E8C547',
    dark: '#D4AF37',
  },
  star: {
    light: '#ac7ec4ff',
    dark: '#5A9BB8',
  },
};

/**
 * 守护精灵基础配置（不含颜色）
 */
const GUARDIAN_SPIRIT_BASE_CONFIG: Omit<GuardianSpiritConfig, 'colors'>[] = [
  {
    id: 'moon',
    nameKey: 'home.moonGuardian',
    descriptionKey: 'home.moonGuardianDesc',
    icon: 'moon',
    type: 'MOON',
    animationUrl: '',
    personality: ['gentle', 'caring', 'wise'],
    createdAt: '',
  },
  {
    id: 'firefly',
    nameKey: 'home.fireflyGuardian',
    descriptionKey: 'home.fireflyGuardianDesc',
    icon: 'zap',
    type: 'FIREFLY',
    animationUrl: '',
    personality: ['bright', 'brave', 'cheerful'],
    createdAt: '',
  },
  {
    id: 'star',
    nameKey: 'home.starGuardian',
    descriptionKey: 'home.starGuardianDesc',
    icon: 'star',
    type: 'STAR',
    animationUrl: '',
    personality: ['bright', 'magical', 'hopeful'],
    createdAt: '',
  },
];

/**
 * 获取指定主题模式下的守护精灵配置
 * @param themeMode - 主题模式：'light' | 'dark'
 * @returns 守护精灵配置数组（包含对应模式的颜色）
 */
export const getGuardianSpiritConfigs = (themeMode: ThemeMode): GuardianSpiritConfig[] => {
  return GUARDIAN_SPIRIT_BASE_CONFIG.map((config) => ({
    ...config,
    colors: GUARDIAN_SPIRIT_COLORS[config.id],
  }));
};

/**
 * 获取指定主题模式下的守护精灵配置（缓存版本）
 */
const lightConfigs = getGuardianSpiritConfigs('light');
const darkConfigs = getGuardianSpiritConfigs('dark');

/**
 * 获取指定主题模式下的守护精灵配置（优化版）
 * @param isDark - 是否为暗色模式
 * @returns 守护精灵配置数组
 */
export const getGuardianSpiritConfigsByMode = (isDark: boolean): GuardianSpiritConfig[] => {
  return isDark ? darkConfigs : lightConfigs;
};

/**
 * 获取单个守护精灵配置
 * @param id - 守护精灵ID
 * @param themeMode - 主题模式（默认为 light）
 * @returns 守护精灵配置或 undefined
 */
export const getGuardianSpiritById = (
  id: GuardianSpiritId | string,
  themeMode: ThemeMode = 'light',
): GuardianSpiritConfig | undefined => {
  const configs = themeMode === 'dark' ? darkConfigs : lightConfigs;
  return configs.find((spirit) => spirit.id === id);
};

/**
 * 获取单个守护精灵配置（使用布尔值判断）
 * @param id - 守护精灵ID
 * @param isDark - 是否为暗色模式
 * @returns 守护精灵配置或 undefined
 */
export const getGuardianSpiritByIdWithMode = (
  id: GuardianSpiritId | string,
  isDark: boolean,
): GuardianSpiritConfig | undefined => {
  return getGuardianSpiritById(id, isDark ? 'dark' : 'light');
};

/**
 * 获取默认守护精灵配置（light模式）
 * @returns 默认守护精灵配置
 */
export const getDefaultGuardianSpirit = (): GuardianSpiritConfig => {
  return lightConfigs[0];
};

/**
 * 获取指定主题模式下的默认守护精灵配置
 * @param isDark - 是否为暗色模式
 * @returns 默认守护精灵配置
 */
export const getDefaultGuardianSpiritByMode = (isDark: boolean): GuardianSpiritConfig => {
  return isDark ? darkConfigs[0] : lightConfigs[0];
};

/**
 * 获取守护精灵的当前模式颜色
 * @param id - 守护精灵ID
 * @param isDark - 是否为暗色模式
 * @returns 当前模式下的颜色值
 */
export const getGuardianSpiritColor = (id: GuardianSpiritId | string, isDark: boolean): string => {
  const colors = GUARDIAN_SPIRIT_COLORS[id as GuardianSpiritId];
  if (!colors) {
    // Fallback to moon spirit color if unknown id
    const defaultColors = GUARDIAN_SPIRIT_COLORS.moon;
    return isDark ? defaultColors.dark : defaultColors.light;
  }
  return isDark ? colors.dark : colors.light;
};

/**
 * 引导步骤配置接口
 */
export interface GuideStepConfig {
  icon: GuardianIconType;
  color: string;
  animationType: 'breathe' | 'pulse' | 'float' | 'scale' | 'none';
}

/**
 * 获取引导步骤配置
 * @param isDark - 是否为暗色模式
 * @returns 引导步骤配置数组
 */
export const getGuideSteps = (isDark: boolean): GuideStepConfig[] => {
  const configs = isDark ? darkConfigs : lightConfigs;
  
  return [
    {
      icon: configs[0].icon,
      color: isDark ? configs[0].colors.dark : configs[0].colors.light,
      animationType: 'breathe',
    },
    {
      icon: configs[2].icon,
      color: isDark ? configs[2].colors.dark : configs[2].colors.light,
      animationType: 'pulse',
    },
    {
      icon: configs[1].icon,
      color: isDark ? configs[1].colors.dark : configs[1].colors.light,
      animationType: 'float',
    },
  ];
};

/**
 * 导出默认的 light 模式配置（保持向后兼容）
 */
export const GUARDIAN_SPIRIT_CONFIG: GuardianSpiritConfig[] = lightConfigs;

/**
 * 导出默认的 light 模式引导步骤配置（保持向后兼容）
 */
export const GUIDE_STEPS: GuideStepConfig[] = getGuideSteps(false);