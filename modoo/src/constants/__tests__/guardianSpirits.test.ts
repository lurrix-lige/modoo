/**
 * GuardianSpirits 常量单元测试
 * 
 * 测试范围：
 * 1. 主题模式颜色配置验证 - 验证 light/dark 模式下各精灵颜色的正确性
 * 2. 颜色获取函数验证 - 验证 getGuardianSpiritColor 等函数的正确性
 * 3. 精灵配置获取函数验证 - 验证 getGuardianSpiritById 等函数的正确性
 * 4. 引导步骤配置验证 - 验证 getGuideSteps 函数的正确性
 */
import { 
  GUARDIAN_SPIRIT_COLORS,
  getGuardianSpiritById,
  getGuardianSpiritByIdWithMode,
  getGuardianSpiritColor,
  getGuardianSpiritConfigs,
  getGuardianSpiritConfigsByMode,
  getDefaultGuardianSpirit,
  getDefaultGuardianSpiritByMode,
  getGuideSteps,
  GuardianSpiritId,
  ThemeMode
} from '../guardianSpirits';

describe('Theme Mode Color Switching', () => {
  describe('GUARDIAN_SPIRIT_COLORS', () => {
    test('should contain all guardian spirit IDs', () => {
      const expectedIds: GuardianSpiritId[] = ['moon', 'firefly', 'star'];
      const actualIds = Object.keys(GUARDIAN_SPIRIT_COLORS) as GuardianSpiritId[];
      
      expect(actualIds).toEqual(expect.arrayContaining(expectedIds));
      expect(actualIds.length).toBe(expectedIds.length);
    });

    test('should have both light and dark colors for each spirit', () => {
      Object.values(GUARDIAN_SPIRIT_COLORS).forEach((colors) => {
        expect(colors.light).toBeDefined();
        expect(colors.dark).toBeDefined();
        expect(colors.light).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(colors.dark).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    test('moon spirit colors should be correct', () => {
      expect(GUARDIAN_SPIRIT_COLORS.moon.light).toBe('#F28B6B');
      expect(GUARDIAN_SPIRIT_COLORS.moon.dark).toBe('#C96B4B');
    });

    test('firefly spirit colors should be correct', () => {
      expect(GUARDIAN_SPIRIT_COLORS.firefly.light).toBe('#E8C547');
      expect(GUARDIAN_SPIRIT_COLORS.firefly.dark).toBe('#D4AF37');
    });

    test('star spirit colors should be correct', () => {
      expect(GUARDIAN_SPIRIT_COLORS.star.light).toBe('#7EAEC4');
      expect(GUARDIAN_SPIRIT_COLORS.star.dark).toBe('#5A9BB8');
    });
  });

  describe('getGuardianSpiritColor', () => {
    test('should return light mode color when isDark is false', () => {
      expect(getGuardianSpiritColor('moon', false)).toBe('#F28B6B');
      expect(getGuardianSpiritColor('firefly', false)).toBe('#E8C547');
      expect(getGuardianSpiritColor('star', false)).toBe('#7EAEC4');
    });

    test('should return dark mode color when isDark is true', () => {
      expect(getGuardianSpiritColor('moon', true)).toBe('#C96B4B');
      expect(getGuardianSpiritColor('firefly', true)).toBe('#D4AF37');
      expect(getGuardianSpiritColor('star', true)).toBe('#5A9BB8');
    });

    test('should handle string id parameter correctly', () => {
      const moonStringId = 'moon' as string;
      expect(getGuardianSpiritColor(moonStringId, false)).toBe('#F28B6B');
      expect(getGuardianSpiritColor(moonStringId, true)).toBe('#C96B4B');
    });

    test('should return fallback color for unknown spirit id', () => {
      const unknownId = 'unknown' as GuardianSpiritId;
      expect(getGuardianSpiritColor(unknownId, false)).toBe('#F28B6B'); // moon light
      expect(getGuardianSpiritColor(unknownId, true)).toBe('#C96B4B'); // moon dark
    });
  });

  describe('getGuardianSpiritById', () => {
    test('should return moon spirit config in light mode by default', () => {
      const moon = getGuardianSpiritById('moon');
      expect(moon).toBeDefined();
      expect(moon?.id).toBe('moon');
      expect(moon?.colors.light).toBe('#F28B6B');
      expect(moon?.colors.dark).toBe('#C96B4B');
    });

    test('should return moon spirit config in dark mode', () => {
      const moon = getGuardianSpiritById('moon', 'dark');
      expect(moon).toBeDefined();
      expect(moon?.id).toBe('moon');
      expect(moon?.colors.dark).toBe('#C96B4B');
    });

    test('should return undefined for unknown spirit id', () => {
      const unknown = getGuardianSpiritById('unknown' as GuardianSpiritId);
      expect(unknown).toBeUndefined();
    });
  });

  describe('getGuardianSpiritByIdWithMode', () => {
    test('should return correct config based on isDark boolean', () => {
      const lightMoon = getGuardianSpiritByIdWithMode('moon', false);
      const darkMoon = getGuardianSpiritByIdWithMode('moon', true);
      
      expect(lightMoon?.colors.light).toBe('#F28B6B');
      expect(darkMoon?.colors.dark).toBe('#C96B4B');
    });
  });

  describe('getGuardianSpiritConfigs', () => {
    test('should return all spirits with light mode colors', () => {
      const configs = getGuardianSpiritConfigs('light');
      expect(configs.length).toBe(3);
      configs.forEach((config) => {
        expect(config.colors.light).toBeDefined();
      });
    });

    test('should return all spirits with dark mode colors', () => {
      const configs = getGuardianSpiritConfigs('dark');
      expect(configs.length).toBe(3);
      configs.forEach((config) => {
        expect(config.colors.dark).toBeDefined();
      });
    });
  });

  describe('getGuardianSpiritConfigsByMode', () => {
    test('should return light configs when isDark is false', () => {
      const configs = getGuardianSpiritConfigsByMode(false);
      expect(configs.length).toBe(3);
    });

    test('should return dark configs when isDark is true', () => {
      const configs = getGuardianSpiritConfigsByMode(true);
      expect(configs.length).toBe(3);
    });
  });

  describe('getDefaultGuardianSpirit', () => {
    test('should return moon spirit as default', () => {
      const defaultSpirit = getDefaultGuardianSpirit();
      expect(defaultSpirit.id).toBe('moon');
      expect(defaultSpirit.colors.light).toBe('#F28B6B');
    });

    test('should return correct default spirit based on mode', () => {
      const lightDefault = getDefaultGuardianSpiritByMode(false);
      const darkDefault = getDefaultGuardianSpiritByMode(true);
      
      expect(lightDefault.id).toBe('moon');
      expect(darkDefault.id).toBe('moon');
      expect(lightDefault.colors.light).toBe('#F28B6B');
      expect(darkDefault.colors.dark).toBe('#C96B4B');
    });
  });

  describe('getGuideSteps', () => {
    test('should return guide steps with light mode colors', () => {
      const steps = getGuideSteps(false);
      expect(steps.length).toBe(3);
      expect(steps[0].color).toBe('#F28B6B'); // moon light
      expect(steps[1].color).toBe('#7EAEC4'); // star light
      expect(steps[2].color).toBe('#E8C547'); // firefly light
    });

    test('should return guide steps with dark mode colors', () => {
      const steps = getGuideSteps(true);
      expect(steps.length).toBe(3);
      expect(steps[0].color).toBe('#C96B4B'); // moon dark
      expect(steps[1].color).toBe('#5A9BB8'); // star dark
      expect(steps[2].color).toBe('#D4AF37'); // firefly dark
    });

    test('should have correct animation types', () => {
      const steps = getGuideSteps(false);
      expect(steps[0].animationType).toBe('breathe');
      expect(steps[1].animationType).toBe('pulse');
      expect(steps[2].animationType).toBe('float');
    });
  });
});

describe('Color Consistency Across Themes', () => {
  test('dark mode colors should be darker than light mode colors', () => {
    Object.entries(GUARDIAN_SPIRIT_COLORS).forEach(([id, colors]) => {
      const lightHex = colors.light.replace('#', '');
      const darkHex = colors.dark.replace('#', '');
      
      const lightRgb = parseInt(lightHex, 16);
      const darkRgb = parseInt(darkHex, 16);
      
      expect(darkRgb).toBeLessThan(lightRgb);
    });
  });

  test('colors should maintain visual distinction between spirits', () => {
    const moonLight = GUARDIAN_SPIRIT_COLORS.moon.light;
    const fireflyLight = GUARDIAN_SPIRIT_COLORS.firefly.light;
    const starLight = GUARDIAN_SPIRIT_COLORS.star.light;
    
    expect(moonLight).not.toBe(fireflyLight);
    expect(moonLight).not.toBe(starLight);
    expect(fireflyLight).not.toBe(starLight);
  });
});

describe('Backward Compatibility', () => {
  test('GUARDIAN_SPIRIT_CONFIG should export light mode configs', () => {
    const { GUARDIAN_SPIRIT_CONFIG } = require('../guardianSpirits');
    expect(GUARDIAN_SPIRIT_CONFIG.length).toBe(3);
    expect(GUARDIAN_SPIRIT_CONFIG[0].id).toBe('moon');
    expect(GUARDIAN_SPIRIT_CONFIG[0].colors.light).toBe('#F28B6B');
  });

  test('GUIDE_STEPS should export light mode steps', () => {
    const { GUIDE_STEPS } = require('../guardianSpirits');
    expect(GUIDE_STEPS.length).toBe(3);
    expect(GUIDE_STEPS[0].color).toBe('#F28B6B');
  });
});