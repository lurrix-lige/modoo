import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { Music, Moon, BookOpen, Leaf, Waves } from 'lucide-react-native';

const comfortIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  book: BookOpen,
  leaf: Leaf,
  water: Waves,
};
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  commonColors,
  sharedStyles,
  specialBackgrounds,
} from '../../../theme';
import { useAppStore } from '../../../store';
import { RootStackParamList } from '../../../navigation/types';

type ComfortModeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ComfortMode'>;

const { width, height } = Dimensions.get('window');

function ComfortOptionCard({
  id,
  icon,
  title,
  description,
  isSelected,
  onSelect,
  colors,
  semiTransparentWhite,
}: {
  id: string;
  icon: string;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  colors: any;
  semiTransparentWhite: string;
}) {
  const IconComp = comfortIconMap[icon] || Music;
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: isSelected ? colors.primary : 'transparent',
        },
      ]}
      onPress={() => onSelect(id)}
    >
      <View
        style={[
          styles.optionIcon,
          { backgroundColor: isSelected ? commonColors.white : colors.primary },
        ]}
      >
        <IconComp size={28} color={isSelected ? colors.primary : commonColors.white} />
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
          { color: isSelected ? semiTransparentWhite : colors.textSecondary },
        ]}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );
}

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
          setExitProgress((prev) => Math.min(prev + 0.1, 1));
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
    }),
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

  const handleOptionSelect = useCallback((optionId: string) => {
    setSelectedOption(optionId);
    exitComfortMode();

    const targetScreens: Record<string, { screen: string; params?: Record<string, any> }> = {
      story: { screen: 'ChildrenHome' },
      breathing: { screen: 'Breathing' },
      whitenoise: { screen: 'RelaxSpace' },
    };

    const target = targetScreens[optionId];
    if (target) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      setTimeout(() => {
        const mainNav = navigation.getParent();
        if (mainNav) {
          mainNav.navigate(target.screen as never, target.params as never);
        }
      }, 100);
    } else {
      navigation.goBack();
    }
  }, [exitComfortMode, navigation]);

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
            <ComfortOptionCard
              id="story" icon="book"
              title={t('comfort.story')} description={t('comfort.storyDesc')}
              isSelected={selectedOption === 'story'} onSelect={handleOptionSelect}
              colors={colors} semiTransparentWhite={semiTransparentWhite}
            />
            <ComfortOptionCard
              id="breathing" icon="leaf"
              title={t('comfort.breathing')} description={t('comfort.breathingDesc')}
              isSelected={selectedOption === 'breathing'} onSelect={handleOptionSelect}
              colors={colors} semiTransparentWhite={semiTransparentWhite}
            />
            <ComfortOptionCard
              id="whitenoise" icon="water"
              title={t('comfort.whitenoise')} description={t('comfort.whitenoiseDesc')}
              isSelected={selectedOption === 'whitenoise'} onSelect={handleOptionSelect}
              colors={colors} semiTransparentWhite={semiTransparentWhite}
            />
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
  avatarContainer: {
    alignItems: 'center',
    borderRadius: 60,
    height: 120,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 120,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  exitConfirmText: {
    fontSize: typography.fontSize.lg,
  },
  exitHint: {
    alignItems: 'center',
    bottom: 50,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  exitHintText: {
    fontSize: typography.fontSize.xs,
  },
  exitOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitProgressRing: {
    alignItems: 'center',
    borderRadius: 50,
    borderWidth: 4,
    height: 100,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 100,
  },
  exitProgressText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.15,
  },
  optionCard: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    padding: spacing.xl,
    width: '47%',
  },
  optionDesc: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  optionIcon: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 56,
  },
  optionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    flexDirection: 'column',
  },
  speechText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
