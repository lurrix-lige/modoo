import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';

interface BreathingBalloonProps {
  isActive: boolean;
  scale?: number;
}

export function BreathingBalloon({ isActive, scale = 1 }: BreathingBalloonProps) {
  const { isDark, colors } = useTheme();
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (isActive) {
      const breathingAnimation = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(animatedScale, {
              toValue: 1.3 * scale,
              duration: 4000,
              useNativeDriver: false,
            }),
            Animated.timing(animatedScale, {
              toValue: 1 * scale,
              duration: 4000,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(animatedOpacity, {
              toValue: 1,
              duration: 4000,
              useNativeDriver: false,
            }),
            Animated.timing(animatedOpacity, {
              toValue: 0.6,
              duration: 4000,
              useNativeDriver: false,
            }),
          ]),
        ])
      );

      breathingAnimation.start();

      return () => {
        breathingAnimation.stop();
      };
    } else {
      animatedScale.setValue(1 * scale);
      animatedOpacity.setValue(0.6);
    }
  }, [isActive, scale]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.outerRing,
          {
            transform: [{ scale: animatedScale }],
            opacity: animatedOpacity,
            borderColor: isDark ? colors.primary : colors.secondary,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.innerCircle,
          {
            transform: [{ scale: animatedScale }],
            opacity: animatedOpacity,
            backgroundColor: isDark ? colors.primary : colors.secondary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'absolute',
  },
  outerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    position: 'absolute',
  },
});
