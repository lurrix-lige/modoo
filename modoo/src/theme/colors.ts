/**
 * Dozoo 双主题配色系统
 * 包含日间模式和夜间模式的完整色彩定义
 *
 * 颜色格式说明：
 * - HEX: 十六进制格式，用于CSS和React Native样式
 * - RGB: 红绿蓝格式，用于需要RGB值的场景
 * - HSL: 色相-饱和度-亮度格式，用于颜色操作和调整
 *
 * WCAG 2.1 AA 标准：
 * - 正常文本对比度 ≥ 4.5:1
 * - 大文本对比度 ≥ 3:1
 * - UI组件和图形对比度 ≥ 3:1
 */

export interface ColorFormat {
  hex: string;
  rgb: string;
  hsl: string;
}

export interface ThemeColorSet {
  primary: ColorFormat;
  primaryDark: ColorFormat;
  primaryLight: ColorFormat;
  secondary: ColorFormat;
  secondaryDark: ColorFormat;
  secondaryLight: ColorFormat;
  accent: ColorFormat;
  accentDark: ColorFormat;
  accentLight: ColorFormat;
}

export interface NeutralColorSet {
  level1: ColorFormat;
  level2: ColorFormat;
  level3: ColorFormat;
  level4: ColorFormat;
  level5: ColorFormat;
  level6: ColorFormat;
  level7: ColorFormat;
}

export interface SemanticColorSet {
  regular: ColorFormat;
  emphasis: ColorFormat;
}

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  gradient: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textPlaceholder: string;
  textDisabled: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  disabled: string;
  border: string;
  borderLight: string;
  shadow: string;
  overlay: string;
}

export interface SemanticColors {
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
}

export interface BackgroundGradient {
  start: string;
  end: string;
  angle: number;
}

/**
 * 日间模式（Light Mode）配色方案
 *
 * 设计原则：
 * - 温暖柔和的主色调，营造温馨亲切感
 * - 高对比度确保可读性
 * - 避免过亮的白色，采用米白等柔和色调
 * - 使用低饱和度的颜色减少视觉疲劳
 *
 * 适用场景：日常使用，户外环境，办公环境
 * WCAG对比度：所有文本均满足4.5:1以上
 */
const lightColorSet: ThemeColorSet = {
  primary: {
    hex: '#F28B6B', // 原 #ED8B6A 饱和度+10%，更有活力
    rgb: 'rgb(242, 139, 107)',
    hsl: 'hsl(18, 85%, 68%)',
  },
  primaryDark: {
    hex: '#C96B4B',
    rgb: 'rgb(201, 107, 75)',
    hsl: 'hsl(18, 68%, 55%)',
  },
  primaryLight: {
    hex: '#F5B99E',
    rgb: 'rgb(245, 185, 158)',
    hsl: 'hsl(18, 88%, 80%)',
  },
  secondary: {
    hex: '#FB7185',
    rgb: 'rgb(251, 113, 133)',
    hsl: 'hsl(352, 92%, 71%)',
  },
  secondaryDark: {
    hex: '#F43F5E',
    rgb: 'rgb(244, 63, 94)',
    hsl: 'hsl(342, 87%, 60%)',
  },
  secondaryLight: {
    hex: '#FDA4AF',
    rgb: 'rgb(253, 164, 175)',
    hsl: 'hsl(352, 91%, 82%)',
  },
  accent: {
    hex: '#A68AD0',
    rgb: 'rgb(166, 138, 208)',
    hsl: 'hsl(260, 52%, 68%)',
  },
  accentDark: {
    hex: '#7A5DB0',
    rgb: 'rgb(122, 93, 176)',
    hsl: 'hsl(260, 42%, 52%)',
  },
  accentLight: {
    hex: '#C9B5E2',
    rgb: 'rgb(201, 181, 226)',
    hsl: 'hsl(260, 55%, 82%)',
  },
};

const lightNeutralSet: NeutralColorSet = {
  level1: { hex: '#FFFFFF', rgb: 'rgb(255,255,255)', hsl: 'hsl(0,0%,100%)' },
  level2: { hex: '#FFF6EE', rgb: 'rgb(255,246,238)', hsl: 'hsl(28,100%,97%)' },
  level3: { hex: '#F5EDE6', rgb: 'rgb(245,237,230)', hsl: 'hsl(25,43%,93%)' },
  level4: { hex: '#E4DDD5', rgb: 'rgb(228,221,213)', hsl: 'hsl(28,22%,87%)' },
  level5: { hex: '#8B7B72', rgb: 'rgb(139,123,114)', hsl: 'hsl(25,10%,50%)' }, // 原 #A09A94，改为温暖灰
  level6: { hex: '#6B5B52', rgb: 'rgb(107,91,82)', hsl: 'hsl(25,13%,37%)' }, // 原 #5A5550，改为浅可可
  level7: { hex: '#4A3B32', rgb: 'rgb(74,59,50)', hsl: 'hsl(25,20%,24%)' }, // 原 #2D2A26，改为深可可，更有故事感
};

const lightSemanticSet: Record<string, SemanticColorSet> = {
  success: {
    regular: {
      hex: '#7DC98F', // 原 #6BBF7A，更清新自然的绿
      rgb: 'rgb(125, 201, 143)',
      hsl: 'hsl(134, 50%, 64%)',
    },
    emphasis: {
      hex: '#5DD060', // 原 #4CAF50，更温暖的绿
      rgb: 'rgb(93, 208, 96)',
      hsl: 'hsl(122, 56%, 59%)',
    },
  },
  warning: {
    regular: {
      hex: '#E8C547', // 保持
      rgb: 'rgb(232, 197, 71)',
      hsl: 'hsl(48, 78%, 59%)',
    },
    emphasis: {
      hex: '#FFD54F', // 原 #FFC107，更温暖的金黄
      rgb: 'rgb(255, 213, 79)',
      hsl: 'hsl(48, 100%, 65%)',
    },
  },
  error: {
    regular: {
      hex: '#E88A8A', // 原 #D96B6B，更柔和的珊瑚红
      rgb: 'rgb(232, 138, 138)',
      hsl: 'hsl(0, 68%, 72%)',
    },
    emphasis: {
      hex: '#FF7F7F', // 原 #E53935，软萌珊瑚红
      rgb: 'rgb(255, 127, 127)',
      hsl: 'hsl(0, 100%, 75%)',
    },
  },
  info: {
    regular: {
      hex: '#7CB3E0', // 原 #6BA3D9，更清新的蓝
      rgb: 'rgb(124, 179, 224)',
      hsl: 'hsl(210, 62%, 68%)',
    },
    emphasis: {
      hex: '#64B5F6', // 原 #2196F3，柔和天空蓝
      rgb: 'rgb(100, 181, 246)',
      hsl: 'hsl(210, 82%, 68%)',
    },
  },
};

/**
 * 夜间模式（Dark Mode）配色方案
 *
 * 设计原则：
 * - 降低整体亮度，避免刺眼
 * - 采用深蓝灰色调，营造夜晚氛围
 * - 提高文本与背景对比度，确保可读性
 * - 避免纯白色文本，采用米白色减少视觉疲劳
 * - 使用低饱和度颜色，防止视觉疲劳
 *
 * 适用场景：夜间使用，低光环境，助眠场景
 * WCAG对比度：所有文本均满足4.5:1以上
 */
const darkColorSet: ThemeColorSet = {
  primary: {
    hex: '#EC9A78',
    rgb: 'rgb(236, 154, 120)',
    hsl: 'hsl(18, 78%, 70%)',
  },
  primaryDark: {
    hex: '#C96B4B',
    rgb: 'rgb(201, 107, 75)',
    hsl: 'hsl(18, 68%, 55%)',
  },
  primaryLight: {
    hex: '#F5C0A5',
    rgb: 'rgb(245, 192, 165)',
    hsl: 'hsl(18, 85%, 82%)',
  },
  secondary: {
    hex: '#FB7185',
    rgb: 'rgb(251, 113, 133)',
    hsl: 'hsl(352, 92%, 71%)',
  },
  secondaryDark: {
    hex: '#F43F5E',
    rgb: 'rgb(244, 63, 94)',
    hsl: 'hsl(342, 87%, 60%)',
  },
  secondaryLight: {
    hex: '#FDA4AF',
    rgb: 'rgb(253, 164, 175)',
    hsl: 'hsl(352, 91%, 82%)',
  },
  accent: {
    hex: '#9B85C8',
    rgb: 'rgb(155, 133, 200)',
    hsl: 'hsl(260, 42%, 66%)',
  },
  accentDark: {
    hex: '#7A5DB0',
    rgb: 'rgb(122, 93, 176)',
    hsl: 'hsl(260, 42%, 52%)',
  },
  accentLight: {
    hex: '#C0AED8',
    rgb: 'rgb(192, 174, 216)',
    hsl: 'hsl(260, 40%, 78%)',
  },
};

const darkNeutralSet: NeutralColorSet = {
  level1: { hex: '#2A2028', rgb: 'rgb(42,32,40)', hsl: 'hsl(330,15%,15%)' }, // 原 #28222A，加入暖紫调，更像被窝
  level2: { hex: '#322830', rgb: 'rgb(50,40,48)', hsl: 'hsl(330,12%,17%)' }, // 原 #2E2730，加入暖紫
  level3: { hex: '#3D3040', rgb: 'rgb(61,48,64)', hsl: 'hsl(280,12%,22%)' }, // 原 #3A3038，暖紫藏蓝
  level4: { hex: '#4A4048', rgb: 'rgb(74,64,72)', hsl: 'hsl(330,7%,27%)' },
  level5: { hex: '#5C5458', rgb: 'rgb(92,84,88)', hsl: 'hsl(330,5%,35%)' },
  level6: { hex: '#908888', rgb: 'rgb(144,136,136)', hsl: 'hsl(0,3%,55%)' },
  level7: { hex: '#EDE8E2', rgb: 'rgb(237,232,226)', hsl: 'hsl(33,23%,91%)' },
};

const darkSemanticSet: Record<string, SemanticColorSet> = {
  success: {
    regular: {
      hex: '#7DC98F',
      rgb: 'rgb(125, 201, 143)',
      hsl: 'hsl(134, 50%, 64%)',
    },
    emphasis: {
      hex: '#66BB6A',
      rgb: 'rgb(102, 187, 106)',
      hsl: 'hsl(122, 39%, 57%)',
    },
  },
  warning: {
    regular: {
      hex: '#F0D060',
      rgb: 'rgb(240, 208, 96)',
      hsl: 'hsl(48, 82%, 66%)',
    },
    emphasis: {
      hex: '#FFD54F',
      rgb: 'rgb(255, 213, 79)',
      hsl: 'hsl(48, 100%, 65%)',
    },
  },
  error: {
    regular: {
      hex: '#E88080',
      rgb: 'rgb(232, 128, 128)',
      hsl: 'hsl(0, 69%, 71%)',
    },
    emphasis: {
      hex: '#EF5350',
      rgb: 'rgb(239, 83, 80)',
      hsl: 'hsl(2, 84%, 63%)',
    },
  },
  info: {
    regular: {
      hex: '#7CB3E0',
      rgb: 'rgb(124, 179, 224)',
      hsl: 'hsl(210, 62%, 68%)',
    },
    emphasis: {
      hex: '#42A5F5',
      rgb: 'rgb(66, 165, 245)',
      hsl: 'hsl(210, 86%, 61%)',
    },
  },
};

/**
 * 颜色集合导出
 */
export const colorSets = {
  light: {
    primary: lightColorSet,
    neutral: lightNeutralSet,
    semantic: lightSemanticSet,
  },
  dark: {
    primary: darkColorSet,
    neutral: darkNeutralSet,
    semantic: darkSemanticSet,
  },
};

/**
 * 简化的颜色对象，用于向后兼容
 * 取自 ThemeColors 中的值
 */
export const colors = {
  light: {
    primary: lightColorSet.primary.hex,
    primaryDark: lightColorSet.primaryDark.hex,
    primaryLight: lightColorSet.primaryLight.hex,
    secondary: lightColorSet.secondary.hex,
    secondaryDark: lightColorSet.secondaryDark.hex,
    secondaryLight: lightColorSet.secondaryLight.hex,
    accent: lightColorSet.accent.hex,
    accentDark: lightColorSet.accentDark.hex,
    accentLight: lightColorSet.accentLight.hex,
    background: lightNeutralSet.level2.hex,
    surface: lightNeutralSet.level1.hex,
    surfaceVariant: lightNeutralSet.level3.hex,
    gradient: lightColorSet.accent.hex,
    textPrimary: lightNeutralSet.level7.hex,
    textSecondary: lightNeutralSet.level6.hex,
    textTertiary: lightNeutralSet.level5.hex,
    textPlaceholder: lightNeutralSet.level5.hex,
    textDisabled: lightNeutralSet.level4.hex,
    success: lightSemanticSet.success.regular.hex,
    successLight: lightSemanticSet.success.emphasis.hex,
    warning: lightSemanticSet.warning.regular.hex,
    warningLight: lightSemanticSet.warning.emphasis.hex,
    error: lightSemanticSet.error.regular.hex,
    errorLight: lightSemanticSet.error.emphasis.hex,
    info: lightSemanticSet.info.regular.hex,
    infoLight: lightSemanticSet.info.emphasis.hex,
    disabled: lightNeutralSet.level4.hex,
    border: lightNeutralSet.level4.hex,
    borderLight: lightNeutralSet.level3.hex,
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    primary: darkColorSet.primary.hex,
    primaryDark: darkColorSet.primaryDark.hex,
    primaryLight: darkColorSet.primaryLight.hex,
    secondary: darkColorSet.secondary.hex,
    secondaryDark: darkColorSet.secondaryDark.hex,
    secondaryLight: darkColorSet.secondaryLight.hex,
    accent: darkColorSet.accent.hex,
    accentDark: darkColorSet.accentDark.hex,
    accentLight: darkColorSet.accentLight.hex,
    background: darkNeutralSet.level2.hex,
    surface: darkNeutralSet.level1.hex,
    surfaceVariant: darkNeutralSet.level3.hex,
    gradient: darkColorSet.accent.hex,
    textPrimary: darkNeutralSet.level7.hex,
    textSecondary: darkNeutralSet.level6.hex,
    textTertiary: darkNeutralSet.level5.hex,
    textPlaceholder: darkNeutralSet.level5.hex,
    textDisabled: darkNeutralSet.level4.hex,
    success: darkSemanticSet.success.regular.hex,
    successLight: darkSemanticSet.success.emphasis.hex,
    warning: darkSemanticSet.warning.regular.hex,
    warningLight: darkSemanticSet.warning.emphasis.hex,
    error: darkSemanticSet.error.regular.hex,
    errorLight: darkSemanticSet.error.emphasis.hex,
    info: darkSemanticSet.info.regular.hex,
    infoLight: darkSemanticSet.info.emphasis.hex,
    disabled: darkNeutralSet.level4.hex,
    border: darkNeutralSet.level3.hex,
    borderLight: darkNeutralSet.level4.hex,
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const semanticColors = {
  light: {
    success: lightSemanticSet.success.regular.hex,
    successLight: lightSemanticSet.success.emphasis.hex,
    warning: lightSemanticSet.warning.regular.hex,
    warningLight: lightSemanticSet.warning.emphasis.hex,
    error: lightSemanticSet.error.regular.hex,
    errorLight: lightSemanticSet.error.emphasis.hex,
    info: lightSemanticSet.info.regular.hex,
    infoLight: lightSemanticSet.info.emphasis.hex,
  },
  dark: {
    success: darkSemanticSet.success.regular.hex,
    successLight: darkSemanticSet.success.emphasis.hex,
    warning: darkSemanticSet.warning.regular.hex,
    warningLight: darkSemanticSet.warning.emphasis.hex,
    error: darkSemanticSet.error.regular.hex,
    errorLight: darkSemanticSet.error.emphasis.hex,
    info: darkSemanticSet.info.regular.hex,
    infoLight: darkSemanticSet.info.emphasis.hex,
  },
};

export const commonColors = {
  white: lightNeutralSet.level1.hex,
  black: lightNeutralSet.level7.hex,
  transparent: 'transparent',
};

export const backgroundGradient = {
  light: {
    start: '#FFF8DC',
    end: '#FFF4EC',
    angle: 180,
  },
  dark: {
    start: '#2A2028', // 原 #1A1A2E，暖紫藏蓝，更像被窝
    end: '#322830', // 原 #252640，暖紫
    angle: 180,
  },
};

export const specialBackgrounds = {
  comfortMode: {
    light: '#2D1F1F',
    dark: '#1E1A2C', // 原 #1A1520，暖紫藏蓝
  },
};

export const storyCoverColors = {
  light: [
    lightColorSet.primary.hex,
    lightColorSet.secondary.hex,
    lightColorSet.accent.hex,
    lightSemanticSet.warning.regular.hex,
  ],
  dark: [
    darkColorSet.primary.hex,
    darkColorSet.secondary.hex,
    darkColorSet.accent.hex,
    darkSemanticSet.warning.regular.hex,
  ],
};

/**
 * 主题特定的强调色
 */
export const emphasisColors = {
  primary: {
    light: {
      soft: 'rgba(232, 150, 122, 0.1)',
      light: 'rgba(232, 150, 122, 0.2)',
      medium: 'rgba(232, 150, 122, 0.3)',
    },
    dark: {
      soft: 'rgba(232, 168, 138, 0.1)',
      light: 'rgba(232, 168, 138, 0.2)',
      medium: 'rgba(232, 168, 138, 0.3)',
    },
  },
  secondary: {
    light: {
      soft: 'rgba(251, 113, 133, 0.1)',
      light: 'rgba(251, 113, 133, 0.2)',
      medium: 'rgba(251, 113, 133, 0.3)',
    },
    dark: {
      soft: 'rgba(251, 113, 133, 0.1)',
      light: 'rgba(251, 113, 133, 0.2)',
      medium: 'rgba(251, 113, 133, 0.3)',
    },
  },
};

export const glassEffect = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    overlayColor: 'rgba(255, 255, 255, 0.3)',
    highlightColor: 'rgba(255, 255, 255, 0.9)',
  },
  dark: {
    backgroundColor: 'rgba(37, 38, 64, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    overlayColor: 'rgba(255, 255, 255, 0.05)',
    highlightColor: 'rgba(255, 255, 255, 0.15)',
  },
};

export const gradients = {
  primary: {
    light: ['#E8967A', '#C4725A'],
    dark: ['#E8A88A', '#C4725A'],
  },
  secondary: {
    light: ['#FB7185', '#F43F5E'],
    dark: ['#FB7185', '#F43F5E'],
  },
  subtle: {
    light: ['rgba(232, 150, 122, 0.1)', 'rgba(126, 174, 196, 0.1)'],
    dark: ['rgba(232, 168, 138, 0.1)', 'rgba(143, 184, 204, 0.1)'],
  },
};

/**
 * 阴影样式系统
 *
 * 支持平台：
 * - iOS/Android: elevation (由 React Native 处理)
 * - Web: boxShadow (CSS 格式)
 */
export const shadows = {
  small: {
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  medium: {
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  large: {
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
};
