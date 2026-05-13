/**
 * 引导页面组件
 * 
 * 应用首次启动时展示的引导页面，通过滑动切换展示应用核心功能介绍�?
 * 使用独立�?GuardianSpirit 组件实现精灵动画效果�?
 * 
 * @component
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, typography, sharedStyles } from '../../../theme';
import { Button, GuardianSpirit } from '../../../components';
import { RootStackParamList } from '../../../navigation/types';
import { GUIDE_STEPS } from '../../../constants/guardianSpirits';

type GuideScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Guide'>;

const { width } = Dimensions.get('window');

/**
 * 引导页面组件
 */
export default function GuideScreen() {
  const navigation = useNavigation<GuideScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  /**
   * 处理下一步按钮点�?
   */
  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigation.navigate('Home');
    }
  };

  /**
   * 处理跳过按钮点击
   */
  const handleSkip = () => {
    navigation.navigate('Home');
  };

  /**
   * 渲染单个引导步骤
   */
  const renderStep = (step: (typeof GUIDE_STEPS)[0], index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
    });
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
    });

    const guideSteps = t('guide.steps', { returnObjects: true }) as Array<{ title: string; description: string }>;

    return (
      <Animated.View
        key={index}
        style={[styles.stepContainer, { opacity, transform: [{ scale }] }]}
      >
        {/* 使用独立�?GuardianSpirit 组件 - 双层圆形设计 */}
        <GuardianSpirit
          icon={step.icon}
          size={200}
          color={step.color}
          innerColor={step.innerColor}
          animationType={step.animationType}
          animationDuration={2000}
        />
        
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
          {guideSteps[index]?.title}
        </Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {guideSteps[index]?.description}
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaContainer style={{ backgroundColor: colors.background }}>
      {/* 跳过按钮 */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          {t('guide.skip')}
        </Text>
      </TouchableOpacity>

      {/* 引导步骤滚动区域 */}
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {GUIDE_STEPS.map((step, index) => renderStep(step, index))}
      </Animated.ScrollView>

      {/* 分页指示�?*/}
      <View style={styles.pagination}>
        {GUIDE_STEPS.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: index === currentStep ? colors.primary : colors.border,
                },
              ]}
            />
          );
        })}
      </View>

      {/* 下一�?开始按�?*/}
      <View style={styles.buttonContainer}>
        <Button
          title={currentStep === GUIDE_STEPS.length - 1 ? t('guide.start') : t('guide.next')}
          onPress={handleNext}
        />
      </View>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    position: 'absolute',
    top: spacing.xxxl,
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: typography.fontSize.md,
  },
  stepContainer: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  stepTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xxl,
  },
  stepDescription: {
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    lineHeight: 28,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xxl,
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
