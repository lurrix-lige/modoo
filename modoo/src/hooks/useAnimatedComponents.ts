import { useState, useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function useFadeIn(delay: number = 0) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: false,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };
}

export function useParallax(scrollY: Animated.Value) {
  return {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, SCREEN_HEIGHT],
          outputRange: [0, SCREEN_HEIGHT * 0.3],
          extrapolate: 'clamp',
        }),
      },
    ],
  };
}
