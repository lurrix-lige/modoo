/**
 * GuardianSpirit 守护精灵组件
 * 
 * 统一的守护精灵展示组件，提供一致的视觉规范和交互体验。
 * 
 * ## 设计规范
 * 
 * ### 固定比例关系（不可变更）
 * | 比例项 | 值 | 说明 |
 * |--------|-----|------|
 * | 内圈/外圈比例 | 0.7 | 内层圆形直径 = 外层圆形直径 × 0.7 |
 * | 图标/外圈比例 | 0.4 | 图标大小 = 外圈直径 × 0.4 |
 * | 圆角比例 | 0.5 | 始终为圆形 |
 * 
 * ### 尺寸预设（可配置）
 * | 预设名称 | 外圈尺寸 | 内圈尺寸 | 图标尺寸 | 适用场景 |
 * |----------|---------|---------|---------|---------|
 * | xs | 60 | 42 | 24 | 列表项、小型展示 |
 * | sm | 100 | 70 | 40 | 卡片、中等展示 |
 * | md | 140 | 98 | 56 | 默认、标准展示 |
 * | lg | 180 | 126 | 72 | 播放器、突出展示 |
 * | xl | 220 | 154 | 88 | 首页、主视觉区域 |
 * | custom | 自定义 | 自动计算 | 自动计算 | 特殊需求 |
 * 
 * ### 颜色规范
 * - 外圈颜色：主题主色或精灵特定颜色
 * - 内圈颜色：外圈颜色的深色版本（自动计算或指定）
 * - 图标颜色：白色（#FFFFFF）
 * 
 * ## 使用示例
 * 
 * ```tsx
 * // 基础用法 - 使用尺寸预设
 * <GuardianSpirit
 *   icon="moon"
 *   size="md"
 *   color="#7EAEC4"
 * />
 * 
 * // 自定义尺寸
 * <GuardianSpirit
 *   icon="star"
 *   size={200}
 *   color="#E8C547"
 *   animated={true}
 *   animationType="breathe"
 * />
 * 
 * // 带名称和交互
 * <GuardianSpirit
 *   icon="zap"
 *   size="lg"
 *   color="#B4A7D6"
 *   name="小星星"
 *   onPress={() => console.log('clicked')}
 * />
 * ```
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Moon, Star, ShieldCheck, Zap } from 'lucide-react-native';

/**
 * 支持的图标类型
 */
export type GuardianIconType = 'moon' | 'star' | 'shield-checkmark' | 'zap';

/**
 * 支持的动画类型
 */
export type AnimationType = 'breathe' | 'pulse' | 'float' | 'scale' | 'none';

/**
 * 触发方式
 */
export type TriggerType = 'auto' | 'manual';

/**
 * 尺寸预设类型
 */
export type SizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 尺寸预设值映射
 */
const SIZE_PRESETS: Record<SizePreset, number> = {
  xs: 60,
  sm: 100,
  md: 140,
  lg: 180,
  xl: 220,
};

/**
 * 固定比例常量
 */
export const GUARDIAN_SPIRIT_CONSTANTS = {
  INNER_SIZE_RATIO: 0.7,      // 内圈/外圈比例
  ICON_SIZE_RATIO: 0.4,       // 图标/外圈比例
  BORDER_RADIUS_RATIO: 0.5,   // 圆角比例（圆形）
};

/**
 * 组件属性接口
 */
export interface GuardianSpiritProps {
  /**
   * 精灵图标类型
   */
  icon: GuardianIconType;

  /**
   * 尺寸配置：可以是预设值或自定义数值
   * @default 'md'
   */
  size?: SizePreset | number;

  /**
   * 外圈颜色
   */
  color: string;

  /**
   * 内圈颜色（默认自动计算为外圈颜色的深色版本）
   */
  innerColor?: string;

  /**
   * 是否显示内圈
   * @default true
   */
  showInnerCircle?: boolean;

  /**
   * 动画类型
   * @default 'breathe'
   */
  animationType?: AnimationType;

  /**
   * 动画持续时间（毫秒）
   * @default 2000
   */
  animationDuration?: number;

  /**
   * 触发方式
   * @default 'auto'
   */
  triggerType?: TriggerType;

  /**
   * 图标颜色
   * @default '#FFFFFF'
   */
  iconColor?: string;

  /**
   * 是否启用动画
   * @default true
   */
  animated?: boolean;

  /**
   * 精灵名称（显示在图标下方）
   */
  name?: string;

  /**
   * 名称文字颜色
   * @default '#4A3B32'
   */
  nameColor?: string;

  /**
   * 名称文字大小
   * @default 14
   */
  nameSize?: number;

  /**
   * 名称最大宽度（用于断行）
   * @default 80
   */
  nameMaxWidth?: number;

  /**
   * 点击回调
   */
  onPress?: () => void;

  /**
   * 长按回调
   */
  onLongPress?: () => void;

  /**
   * 自定义样式（应用于外层容器）
   */
  style?: StyleProp<ViewStyle>;

  /**
   * 自定义内圈样式
   */
  innerStyle?: StyleProp<ViewStyle>;
}

/**
 * 图标映射表
 */
const iconMap: Record<GuardianIconType, any> = {
  moon: Moon,
  star: Star,
  'shield-checkmark': ShieldCheck,
  zap: Zap,
};

/**
 * 默认配置
 */
const DEFAULT_SIZE: SizePreset = 'md';
const DEFAULT_ANIMATION_TYPE: AnimationType = 'breathe';
const DEFAULT_ANIMATION_DURATION = 2000;
const DEFAULT_TRIGGER_TYPE: TriggerType = 'auto';
const DEFAULT_ICON_COLOR = '#FFFFFF';
const DEFAULT_ANIMATED = true;
const DEFAULT_SHOW_INNER_CIRCLE = true;
const DEFAULT_NAME_COLOR = '#4A3B32';
const DEFAULT_NAME_SIZE = 14;
const DEFAULT_NAME_MAX_WIDTH = 80;

/**
 * 计算颜色变暗
 */
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
};

/**
 * 守护精灵组件
 */
export default function GuardianSpirit({
  icon,
  size: sizeProp = DEFAULT_SIZE,
  color,
  innerColor: innerColorProp,
  showInnerCircle = DEFAULT_SHOW_INNER_CIRCLE,
  animationType = DEFAULT_ANIMATION_TYPE,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  triggerType = DEFAULT_TRIGGER_TYPE,
  iconColor = DEFAULT_ICON_COLOR,
  animated = DEFAULT_ANIMATED,
  name,
  nameColor = DEFAULT_NAME_COLOR,
  nameSize = DEFAULT_NAME_SIZE,
  nameMaxWidth = DEFAULT_NAME_MAX_WIDTH,
  onPress,
  onLongPress,
  style,
  innerStyle,
}: GuardianSpiritProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  /**
   * 解析尺寸值
   */
  const outerSize = typeof sizeProp === 'string' 
    ? SIZE_PRESETS[sizeProp] 
    : sizeProp;

  /**
   * 计算内圈尺寸（固定比例）
   */
  const innerSize = outerSize * GUARDIAN_SPIRIT_CONSTANTS.INNER_SIZE_RATIO;

  /**
   * 计算图标尺寸（固定比例）
   */
  const iconSize = outerSize * GUARDIAN_SPIRIT_CONSTANTS.ICON_SIZE_RATIO;

  /**
   * 自动计算内圈颜色（比外圈颜色深30%）
   */
  const computedInnerColor = innerColorProp || darkenColor(color, 30);

  /**
   * 创建呼吸动画
   */
  const createBreatheAnimation = () => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: false,
        }),
      ]),
    );
  };

  /**
   * 创建脉冲动画
   */
  const createPulseAnimation = () => {
    const duration = animationDuration / 2;
    return Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
      ]),
    );
  };

  /**
   * 创建浮动动画
   */
  const createFloatAnimation = () => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(translateYAnim, {
          toValue: -8,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: false,
        }),
      ]),
    );
  };

  /**
   * 创建缩放动画
   */
  const createScaleAnimation = () => {
    const duration = animationDuration / 3;
    return Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
      ]),
    );
  };

  /**
   * 获取动画实例
   */
  const getAnimation = () => {
    switch (animationType) {
      case 'breathe':
        return createBreatheAnimation();
      case 'pulse':
        return createPulseAnimation();
      case 'float':
        return createFloatAnimation();
      case 'scale':
        return createScaleAnimation();
      case 'none':
      default:
        return null;
    }
  };

  /**
   * 启动动画
   */
  useEffect(() => {
    if (!animated || triggerType !== 'auto') return;

    const animation = getAnimation();
    if (animation) {
      animation.start();
      return () => animation.stop();
    }
  }, [animated, triggerType, animationType, animationDuration]);

  /**
   * 获取合并后的变换样式
   */
  const getTransformStyle = () => {
    if (animated) {
      return [{ scale: scaleAnim }, { translateY: translateYAnim }];
    }
    return [{ scale: 1 }, { translateY: 0 }];
  };

  // 获取图标组件
  const IconComp = iconMap[icon] || Moon;

  // 是否需要可触摸
  const isTouchable = onPress || onLongPress;

  // 渲染精灵图标
  const spiritIcon = (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize * GUARDIAN_SPIRIT_CONSTANTS.BORDER_RADIUS_RATIO,
          backgroundColor: color,
          opacity: opacityAnim,
          transform: getTransformStyle(),
        },
        style,
      ]}
    >
      {/* 内层圆形（双层设计） */}
      {showInnerCircle && (
        <View
          style={[
            styles.innerContainer,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize * GUARDIAN_SPIRIT_CONSTANTS.BORDER_RADIUS_RATIO,
              backgroundColor: computedInnerColor,
            },
            innerStyle,
          ]}
        >
          <IconComp size={iconSize} color={iconColor} />
        </View>
      )}
      {/* 单层设计：直接显示图标 */}
      {!showInnerCircle && <IconComp size={iconSize} color={iconColor} />}
    </Animated.View>
  );

  // 如果有名称，包装在容器中
  const content = (
    <View style={styles.spiritContainer}>
      {spiritIcon}
      {name && (
        <Text
          style={[
            styles.nameText,
            {
              color: nameColor,
              fontSize: nameSize,
              maxWidth: nameMaxWidth,
            },
          ]}
        >
          {name}
        </Text>
      )}
    </View>
  );

  // 如果有点击或长按事件，包装在 TouchableWithoutFeedback 中
  if (isTouchable) {
    return (
      <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    flexShrink: 1,
    fontWeight: '600',
    lineHeight: 1.4,
    marginTop: 8,
    textAlign: 'center',
  },
  spiritContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },
});
