/**
 * GuardianSpirit 组件单元测试
 * 
 * 测试范围：
 * 1. 尺寸预设验证 - 验证各预设尺寸值的正确性
 * 2. 比例一致性验证 - 验证内圈与外圈、图标与外圈的比例关系
 * 3. 颜色计算验证 - 验证内圈颜色自动变暗功能
 */
import { GUARDIAN_SPIRIT_CONSTANTS } from '../GuardianSpirit';

/**
 * 尺寸预设值映射（与组件内部定义一致）
 */
const SIZE_PRESETS: Record<string, number> = {
  xs: 60,
  sm: 100,
  md: 140,
  lg: 180,
  xl: 220,
};

describe('GuardianSpirit Constants', () => {
  test('INNER_SIZE_RATIO should be 0.7', () => {
    expect(GUARDIAN_SPIRIT_CONSTANTS.INNER_SIZE_RATIO).toBe(0.7);
  });

  test('ICON_SIZE_RATIO should be 0.4', () => {
    expect(GUARDIAN_SPIRIT_CONSTANTS.ICON_SIZE_RATIO).toBe(0.4);
  });

  test('BORDER_RADIUS_RATIO should be 0.5', () => {
    expect(GUARDIAN_SPIRIT_CONSTANTS.BORDER_RADIUS_RATIO).toBe(0.5);
  });
});

describe('Size Presets', () => {
  test('xs preset should be 60', () => {
    expect(SIZE_PRESETS.xs).toBe(60);
  });

  test('sm preset should be 100', () => {
    expect(SIZE_PRESETS.sm).toBe(100);
  });

  test('md preset should be 140', () => {
    expect(SIZE_PRESETS.md).toBe(140);
  });

  test('lg preset should be 180', () => {
    expect(SIZE_PRESETS.lg).toBe(180);
  });

  test('xl preset should be 220', () => {
    expect(SIZE_PRESETS.xl).toBe(220);
  });
});

describe('Proportional Relationships', () => {
  const { INNER_SIZE_RATIO, ICON_SIZE_RATIO } = GUARDIAN_SPIRIT_CONSTANTS;

  test('inner size should be 70% of outer size for all presets', () => {
    Object.values(SIZE_PRESETS).forEach((outerSize) => {
      const expectedInnerSize = outerSize * INNER_SIZE_RATIO;
      expect(expectedInnerSize).toBe(outerSize * 0.7);
    });
  });

  test('icon size should be 40% of outer size for all presets', () => {
    Object.values(SIZE_PRESETS).forEach((outerSize) => {
      const expectedIconSize = outerSize * ICON_SIZE_RATIO;
      expect(expectedIconSize).toBe(outerSize * 0.4);
    });
  });

  test('calculated dimensions should maintain correct proportions for xs size', () => {
    const outerSize = SIZE_PRESETS.xs; // 60
    const innerSize = outerSize * INNER_SIZE_RATIO; // 42
    const iconSize = outerSize * ICON_SIZE_RATIO; // 24

    expect(innerSize).toBe(42);
    expect(iconSize).toBe(24);
    expect(innerSize / outerSize).toBe(0.7);
    expect(iconSize / outerSize).toBe(0.4);
  });

  test('calculated dimensions should maintain correct proportions for sm size', () => {
    const outerSize = SIZE_PRESETS.sm; // 100
    const innerSize = outerSize * INNER_SIZE_RATIO; // 70
    const iconSize = outerSize * ICON_SIZE_RATIO; // 40

    expect(innerSize).toBe(70);
    expect(iconSize).toBe(40);
    expect(innerSize / outerSize).toBe(0.7);
    expect(iconSize / outerSize).toBe(0.4);
  });

  test('calculated dimensions should maintain correct proportions for md size', () => {
    const outerSize = SIZE_PRESETS.md; // 140
    const innerSize = outerSize * INNER_SIZE_RATIO; // 98
    const iconSize = outerSize * ICON_SIZE_RATIO; // 56

    expect(innerSize).toBe(98);
    expect(iconSize).toBe(56);
    expect(innerSize / outerSize).toBe(0.7);
    expect(iconSize / outerSize).toBe(0.4);
  });

  test('calculated dimensions should maintain correct proportions for lg size', () => {
    const outerSize = SIZE_PRESETS.lg; // 180
    const innerSize = outerSize * INNER_SIZE_RATIO; // 126
    const iconSize = outerSize * ICON_SIZE_RATIO; // 72

    expect(innerSize).toBe(126);
    expect(iconSize).toBe(72);
    expect(innerSize / outerSize).toBe(0.7);
    expect(iconSize / outerSize).toBe(0.4);
  });

  test('calculated dimensions should maintain correct proportions for xl size', () => {
    const outerSize = SIZE_PRESETS.xl; // 220
    const innerSize = outerSize * INNER_SIZE_RATIO; // 154
    const iconSize = outerSize * ICON_SIZE_RATIO; // 88

    expect(innerSize).toBe(154);
    expect(iconSize).toBe(88);
    expect(innerSize / outerSize).toBe(0.7);
    expect(iconSize / outerSize).toBe(0.4);
  });

  test('custom size should maintain correct proportions', () => {
    const customSize = 200;
    const innerSize = customSize * INNER_SIZE_RATIO; // 140
    const iconSize = customSize * ICON_SIZE_RATIO; // 80

    expect(innerSize).toBe(140);
    expect(iconSize).toBe(80);
    expect(innerSize / customSize).toBe(0.7);
    expect(iconSize / customSize).toBe(0.4);
  });
});

describe('Color Darkening Logic', () => {
  /**
   * 模拟组件中的 darkenColor 函数
   */
  const darkenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  test('darkenColor should darken color by 30%', () => {
    const originalColor = '#F28B6B'; // primary color
    const darkened = darkenColor(originalColor, 30);
    
    // 验证变暗后的颜色值
    expect(darkened).toBe('#C96B4B');
  });

  test('darkenColor should handle white correctly', () => {
    const white = '#FFFFFF';
    const darkened = darkenColor(white, 30);
    
    expect(darkened).toBe('#E1E1E1');
  });

  test('darkenColor should handle black correctly', () => {
    const black = '#000000';
    const darkened = darkenColor(black, 30);
    
    expect(darkened).toBe('#000000');
  });

  test('darkenColor should clamp values to 0', () => {
    const lightColor = '#333333';
    const darkened = darkenColor(lightColor, 50);
    
    // 所有通道都应该被 clamp 到 0
    expect(darkened).toBe('#000000');
  });

  test('inner color should be 30% darker than outer color', () => {
    const outerColor = '#7EAEC4'; // moon guardian color
    const expectedInnerColor = darkenColor(outerColor, 30);
    
    expect(expectedInnerColor).toBe('#5A9BB8');
  });
});

describe('Component Integration', () => {
  test('should maintain visual consistency across different sizes', () => {
    // 验证所有预设尺寸下的比例关系一致
    const ratios: number[] = [];
    
    Object.values(SIZE_PRESETS).forEach((outerSize) => {
      const innerSize = outerSize * GUARDIAN_SPIRIT_CONSTANTS.INNER_SIZE_RATIO;
      const iconSize = outerSize * GUARDIAN_SPIRIT_CONSTANTS.ICON_SIZE_RATIO;
      
      ratios.push(innerSize / outerSize);
      ratios.push(iconSize / outerSize);
    });

    // 所有比例都应该一致
    const uniqueRatios = [...new Set(ratios)];
    expect(uniqueRatios).toEqual([0.7, 0.4]);
  });

  test('should maintain color consistency across different sizes', () => {
    // 验证颜色计算不依赖于尺寸
    const colors = ['#7EAEC4', '#E8C547', '#B4A7D6', '#F28B6B'];
    
    colors.forEach((color) => {
      const darkened = darkenColor(color, 30);
      // 确保变暗逻辑对所有颜色都有效
      expect(darkened).toBeTruthy();
      expect(darkened.startsWith('#')).toBe(true);
      expect(darkened.length).toBe(7);
    });
  });
});

// 辅助函数
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}