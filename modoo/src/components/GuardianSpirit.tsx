/**
 * 守护精灵展示组件
 *
 * 提供可复用的守护精灵动画展示功能，支持多种动画效果和配置选项。
 * 支持双层圆形设计，与 ChildrenHomeScreen 保持视觉一致性。
 * 支持显示精灵名称，自动处理断行和对齐。
 *
 * @component
 * @example
 * // 双层圆形设计（与 ChildrenHomeScreen 一致）
 * <GuardianSpirit
 *   icon="zap"
 *   size={200}
 *   color="#FF8A65"           // 外层颜色
 *   innerColor="#E67A5A"      // 内层颜色
 *   iconColor="#FFFFFF"       // 图标颜色
 * />
 *
 * @example
 * // 单层圆形设计（简洁模式）
 * <GuardianSpirit
 *   icon="moon"
 *   size={150}
 *   color="#7EAEC4"
 *   showInnerCircle={false}
 * />
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
import { iconSizes, commonColors } from '../theme';

/**
 * 支持的图标类型 */
export type GuardianIconType = 'moon' | 'star' | 'shield-checkmark' | 'zap';

/**
 * 支持的动画类型 */
export type AnimationType = 'breathe' | 'pulse' | 'float' | 'scale' | 'none';

/**
 * 触发方式
 */
export type TriggerType = 'auto' | 'manual';

/**
 * 组件属性接口 */
export interface GuardianSpiritProps {
  /**
   * 精灵图标类型
   */
  icon: GuardianIconType;

  /**
   * 精灵容器尺寸（外层圆形宽高）
   * @default 200
   */
  size?: number;

  /**
   * 外层圆形背景颜色
   */
  color: string;

  /**
   * 内层圆形背景颜色（双层设计时使用）
   * @default color 的深色版本
   */
  innerColor?: string;

  /**
   * 是否显示内层圆形（双层设计）
   * @default true
   */
  showInnerCircle?: boolean;

  /**
   * 内层圆形相对于外层的尺寸比例
   * @default 0.7 (140/200)
   */
  innerSizeRatio?: number;

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
   * 图标大小
   * @default 80
   */
  iconSize?: number;

  /**
   * 图标颜色
   * @default commonColors.white
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
   * @default commonColors.black
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
   * 圆角半径（相对于尺寸的比例）
   * @default 0.5（圆形）
   */
  borderRadiusRatio?: number;

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
   * 自定义内层样式（应用于内层圆形）
   */
  innerStyle?: StyleProp<ViewStyle>;
}

/**
 * 图标映射表 */
const iconMap: Record<GuardianIconType, any> = {
  moon: Moon,
  star: Star,
  'shield-checkmark': ShieldCheck,
  zap: Zap,
};

/**
 * 默认配置
 */
const DEFAULT_SIZE = 200;
const DEFAULT_ANIMATION_TYPE: AnimationType = 'breathe';
const DEFAULT_ANIMATION_DURATION = 2000;
const DEFAULT_TRIGGER_TYPE: TriggerType = 'auto';
const DEFAULT_ICON_SIZE = 80;
const DEFAULT_ICON_COLOR = commonColors.white;
const DEFAULT_ANIMATED = true;
const DEFAULT_BORDER_RADIUS_RATIO = 0.5;
const DEFAULT_SHOW_INNER_CIRCLE = true;
const DEFAULT_NAME_COLOR = commonColors.black;
const DEFAULT_NAME_SIZE = 14;
const DEFAULT_NAME_MAX_WIDTH = 80;
const DEFAULT_INNER_SIZE_RATIO = 0.7;

/**
 * 守护精灵组件
 */
export default function GuardianSpirit({
  icon,
  size = DEFAULT_SIZE,
  color,
  innerColor,
  showInnerCircle = DEFAULT_SHOW_INNER_CIRCLE,
  innerSizeRatio = DEFAULT_INNER_SIZE_RATIO,
  animationType = DEFAULT_ANIMATION_TYPE,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  triggerType = DEFAULT_TRIGGER_TYPE,
  iconSize = DEFAULT_ICON_SIZE,
  iconColor = DEFAULT_ICON_COLOR,
  animated = DEFAULT_ANIMATED,
  borderRadiusRatio = DEFAULT_BORDER_RADIUS_RATIO,
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
   * 创建呼吸动画
   */
  const createBreatheAnimation = () => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
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
          toValue: 0.6,
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
          toValue: -10,
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
          toValue: 1.2,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
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

  // 计算内层圆形尺寸
  const innerSize = size * innerSizeRatio;

  // 是否需要可触摸
  const isTouchable = onPress || onLongPress;

  // 渲染精灵图标
  const spiritIcon = (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          borderRadius: size * borderRadiusRatio,
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
              borderRadius: innerSize * borderRadiusRatio,
              backgroundColor: innerColor || color,
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
