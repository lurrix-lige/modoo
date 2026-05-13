import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaContainer } from '../../../components';
import { Music, Heart, Star, Sun, Moon, CloudRain, Wind, Bird, BookOpen, Leaf, Waves } from 'lucide-react-native';

const comfortIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'book': BookOpen,
  'leaf': Leaf,
  'water': Waves,
};
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, commonColors, sharedStyles, specialBackgrounds } from '../../../theme';
import { useAppStore } from '../../../store';
import { RootStackParamList } from '../../../navigation/types';

type ComfortModeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ComfortMode'>;

const { width, height } = Dimensions.get('window');

export default function ComfortModeScreen() {
  const navigation = useNavigation<ComfortModeNavigationProp>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { enterComfortMode, exitComfortMode, comfortModeVolume } = useAppStore();

  const comfortBgColor = useMemo(() => {
    return isDark ? specialBackgrounds.comfortMode.dark : specialBackgrounds.comfortMode.light;
  }, [isDark]);

  const semiTransparentWhite = useMemo(() => {
    return isDark ? colors.surface : commonColors.white;
  }, [isDark, colors.surface]);

  const semiTransparentHint = useMemo(() => {
    return isDark ? colors.textTertiary : commonColors.white;
  }, [isDark, colors.textTertiary]);

  const exitOverlayColor = useMemo(() => {
    return colors.overlay;
  }, [colors.overlay]);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExitHint, setShowExitHint] = useState(false);
  const [exitProgress, setExitProgress] = useState(0);
  const longPressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();

    enterComfortMode();

    const timer = setTimeout(() => {
      setShowExitHint(true);
    }, 3000);

    return () => {
      clearTimeout(timer);
      exitComfortMode();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.numberActiveTouches >= 3;
      },
      onPanResponderGrant: () => {
        setExitProgress(0);
        Animated.timing(longPressAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.numberActiveTouches >= 3) {
          setExitProgress(prev => Math.min(prev + 0.1, 1));
        }
      },
      onPanResponderRelease: () => {
        if (exitProgress >= 1) {
          handleExit();
        } else {
          Animated.timing(longPressAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
          setExitProgress(0);
        }
      },
    })
  ).current;

  const handleExit = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      exitComfortMode();
      navigation.goBack();
    });
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);

    exitComfortMode();
    switch (optionId) {
      case 'story':
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        break;
      case 'breathing':
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        break;
      case 'whitenoise':
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        break;
      default:
        navigation.goBack();
    }
  };

  const renderComfortOption = (
    id: string,
    icon: string,
    title: string,
    description: string
  ) => {
    const isSelected = selectedOption === id;

    const optionDescColor = useMemo(() => {
      return isSelected ? semiTransparentWhite : colors.textSecondary;
    }, [isSelected, semiTransparentWhite, colors.textSecondary]);

    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.optionCard,
          {
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
        onPress={() => handleOptionSelect(id)}
      >
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: isSelected ? commonColors.white : colors.primary },
          ]}
        >
          {(() => { const IconComp = comfortIconMap[icon] || Music; return <IconComp size={28} color={isSelected ? colors.primary : commonColors.white} />; })()}
        </View>
        <Text
          style={[
            styles.optionTitle,
            { color: isSelected ? commonColors.white : colors.textPrimary },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.optionDesc,
            { color: optionDescColor },
          ]}
        >
          {description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={[
        sharedStyles.container,
        {
          backgroundColor: comfortBgColor,
          opacity: fadeAnim,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <SafeAreaContainer style={styles.safeArea}>
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Moon size={60} color={commonColors.white} />
          </View>
          <Text style={[styles.speechText, { color: commonColors.white }]}>
            {t('comfort.speech')}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.optionsGrid}>
            {renderComfortOption(
              'story',
              'book',
              t('comfort.story'),
              t('comfort.storyDesc')
            )}
            {renderComfortOption(
              'breathing',
              'leaf',
              t('comfort.breathing'),
              t('comfort.breathingDesc')
            )}
            {renderComfortOption(
              'whitenoise',
              'water',
              t('comfort.whitenoise'),
              t('comfort.whitenoiseDesc')
            )}
          </View>
        </View>

        {showExitHint && (
          <View style={styles.exitHint}>
            <Text style={[styles.exitHintText, { color: semiTransparentHint }]}>
              {t('comfort.exitHint')}
            </Text>
          </View>
        )}

        {exitProgress > 0 && (
          <View style={[styles.exitOverlay, { backgroundColor: exitOverlayColor }]}>
            <View style={[styles.exitProgressRing, { borderColor: colors.primary }]}>
              <Text style={[styles.exitProgressText, { color: colors.primary }]}>
                {Math.round(exitProgress * 100)}%
              </Text>
            </View>
            <Text style={[styles.exitConfirmText, { color: commonColors.white }]}>
              {t('comfort.exitConfirm')}
            </Text>
          </View>
        )}
      </SafeAreaContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.15,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  speechText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  optionCard: {
    width: '47%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  exitHint: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  exitHintText: {
    fontSize: typography.fontSize.xs,
  },
  exitOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitProgressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  exitProgressText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  exitConfirmText: {
    fontSize: typography.fontSize.lg,
  },
});
