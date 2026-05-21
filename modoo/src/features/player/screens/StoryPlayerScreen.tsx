import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import {
  ArrowLeft,
  PictureInPicture,
  MoreHorizontal,
  Heart,
  Timer,
  Share2,
  RotateCcw,
  Sun,
  Check,
  ShieldAlert,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChildrenStackParamList } from '../../../navigation/types';
import { ErrorToast, SafeAreaContainer, TimerModal } from '../../../components';
import { usePictureInPicture } from '../../../hooks/usePictureInPicture';
import { logger } from '../../../utils/logger';
import { StoryInfo } from '../components/StoryInfo';
import { PlayerControls } from '../components/PlayerControls';
import {
  useTheme,
  spacing,
  borderRadius,
  typography,
  responsive,
  iconSizes,
  shadows,
  commonColors,
} from '../../../theme';
import { usePlayer } from '../hooks/usePlayer';
import { useSleepTimer } from '../hooks/useSleepTimer';
import { audioFocusManager } from '../../../providers/AudioFocusManager';
import { useShare } from '../../../services/ShareService';
import { useBrightness } from '../hooks/useBrightness';
import { useOrientation } from '../hooks/useOrientation';
import { Story } from '../../../types';
import { useAppStore } from '../../../store';
import { getGuardianSpiritById } from '../../../constants/guardianSpirits';

type StoryPlayerNavigationProp = NativeStackNavigationProp<ChildrenStackParamList>;
type StoryPlayerRouteProp = RouteProp<ChildrenStackParamList, 'StoryPlayer'>;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function StoryPlayerScreen() {
  const navigation = useNavigation<StoryPlayerNavigationProp>();
  const route = useRoute<StoryPlayerRouteProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const { child } = useAppStore();

  const { shareNative, isLoading: isSharing } = useShare();

  const currentSpirit = getGuardianSpiritById(child?.guardianSpiritId || 'moon');

  const { isLandscape, toggleOrientation, lockToPortrait } = useOrientation();
  const {
    isPlaying,
    isBuffering,
    progress,
    duration,
    isLoading,
    story,
    error: playerError,
    resume,
    pause,
    stop,
    seekTo,
    skipForward,
    skipBackward,
    toggleFavorite,
    clearError,
  } = usePlayer(route.params?.storyId);
  const { isNightMode, toggleBrightness } = useBrightness();

  const handleSleepTimerExpire = useCallback(() => {
    stop();
    audioFocusManager.stopAll();
  }, [stop]);

  const {
    timerDuration,
    timerRemainingSeconds,
    showTimerModal,
    setShowTimerModal,
    handleTimerSelect,
    handleCancelTimer,
    formatTimerRemaining,
  } = useSleepTimer(handleSleepTimerExpire);

  // 定时器激活期间，故事播放完毕后自动重播
  useEffect(() => {
    if (!timerDuration || isPlaying || isLoading || !story) return;

    const id = setTimeout(() => {
      logger.debug('Timer active, auto-replaying story');
      resume();
    }, 500);

    return () => clearTimeout(id);
  }, [isPlaying, timerDuration, isLoading, story, resume]);

  const [shareSuccess, setShareSuccess] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  const {
    isAvailable: isPiPAvailable,
    isActive: isPiPActive,
    togglePiP,
  } = usePictureInPicture({
    onEnterPiP: () => logger.info('Entered Picture-in-Picture mode'),
    onExitPiP: () => logger.info('Exited Picture-in-Picture mode'),
  });

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const handleGoBack = useCallback(() => {
    if (isLandscape) {
      lockToPortrait().catch(() => {});
    }
    navigation.goBack();
  }, [isLandscape, lockToPortrait, navigation]);

  const handleFavorite = useCallback(() => {
    toggleFavorite();
  }, [toggleFavorite]);

  const handleShare = useCallback(async () => {
    try {
      /* 分享标题包含标题和描述 TODO: 考虑实现分享内容的富媒体格式*/
      await shareNative({
        title: story?.title || '' + ' \n ' + story?.description || '',
        url: story?.audioUrl || '',
      });
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      logger.error('Failed to share story', { error: err });
    }
  }, [shareNative, story]);

  const handlePrevStory = useCallback(() => {
    logger.info('Navigate to previous story');
  }, []);

  const handleNextStory = useCallback(() => {
    logger.info('Navigate to next story');
  }, []);

  const maxDuration = duration || 0;
  const currentProgress = isSliding ? sliderValue : Math.min(progress || 0, maxDuration);

  const handleSlidingStart = useCallback(() => {
    setIsSliding(true);
    setSliderValue(Math.min(progress || 0, maxDuration));
  }, [progress, maxDuration]);

  const handleValueChange = useCallback((value: number) => {
    setSliderValue(value);
  }, []);

  const handleSlidingComplete = useCallback(
    (value: number) => {
      setIsSliding(false);
      seekTo(value);
    },
    [seekTo],
  );

  if (isLoading) {
    return (
      <SafeAreaContainer style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaContainer>
    );
  }

  if (!story) {
    return (
      <SafeAreaContainer style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('storyPlayer.storyNotFound')}
          </Text>
        </View>
      </SafeAreaContainer>
    );
  }

  const isLandscapeMode = width > height;
  const containerStyle = isLandscapeMode ? styles.landscapeContainer : styles.portraitContainer;
  const contentStyle = isLandscapeMode ? styles.landscapeContent : styles.portraitContent;
  const controlsStyle = isLandscapeMode ? styles.landscapeControls : styles.portraitControls;

  return (
    <SafeAreaContainer style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mainLayout, containerStyle]}>
        <View style={[styles.contentSection, contentStyle]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft
                size={responsive.moderateScaleForIcon(iconSizes.xl)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {story.title}
            </Text>
            <View style={styles.headerActions}>
              {isPiPAvailable && (
                <TouchableOpacity style={styles.headerButton} onPress={togglePiP}>
                  <PictureInPicture
                    size={responsive.moderateScaleForIcon(iconSizes.lg)}
                    color={isPiPActive ? colors.primary : colors.textPrimary}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.moreButton}>
                <MoreHorizontal
                  size={responsive.moderateScaleForIcon(iconSizes.lg)}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <StoryInfo
            story={story as Story & { isFavorite?: boolean }}
            guardianIcon={currentSpirit?.icon || 'moon'}
            onPrevStory={handlePrevStory}
            onNextStory={handleNextStory}
            hasPrevStory={true}
            hasNextStory={true}
          />

          <View style={styles.progressSection}>
            <Slider
              style={styles.progressBar}
              minimumValue={0}
              maximumValue={maxDuration}
              value={currentProgress}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
              onSlidingStart={handleSlidingStart}
              onValueChange={handleValueChange}
              onSlidingComplete={handleSlidingComplete}
            />
            {isBuffering && (
              <Text style={[styles.bufferingText, { color: colors.primary }]}>
                {t('common.loading')}
              </Text>
            )}
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatTime(currentProgress)}
              </Text>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatTime(maxDuration)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.controlsSection, controlsStyle]}>
          <PlayerControls
            isPlaying={isPlaying}
            currentProgress={currentProgress}
            maxDuration={maxDuration}
            onPlayToggle={handlePlayToggle}
            onSkipBackward={() => skipBackward(10)}
            onSkipForward={() => skipForward(10)}
            disabled={!!playerError}
          />

          <View
            style={[styles.secondaryControls, isLandscapeMode && styles.landscapeSecondaryControls]}
          >
            <TouchableOpacity style={styles.secondaryButton} onPress={handleFavorite}>
              <Heart
                size={responsive.moderateScaleForIcon(iconSizes.lg)}
                color={story.isFavorite ? colors.error : colors.textSecondary}
                fill={story.isFavorite ? colors.error : 'none'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowTimerModal(true)}
            >
              <View style={styles.timerButtonContainer}>
                <Timer
                  size={responsive.moderateScaleForIcon(iconSizes.lg)}
                  color={colors.textSecondary}
                />
                {timerDuration && (
                  <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                    {formatTimerRemaining(formatTime)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
              <View style={styles.shareButtonContainer}>
                {shareSuccess ? (
                  <Check
                    size={responsive.moderateScaleForIcon(iconSizes.lg)}
                    color={colors.success}
                  />
                ) : (
                  <Share2
                    size={responsive.moderateScaleForIcon(iconSizes.lg)}
                    color={colors.textSecondary}
                  />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={toggleOrientation}>
              <RotateCcw
                size={responsive.moderateScaleForIcon(iconSizes.lg)}
                color={isLandscape ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={toggleBrightness}>
              <Sun
                size={responsive.moderateScaleForIcon(iconSizes.lg)}
                color={isNightMode ? colors.primary : colors.textSecondary}
                fill={isNightMode ? colors.primary : 'none'}
              />
            </TouchableOpacity>
          </View>

          {!isLandscapeMode && (
            <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
              <ShieldAlert
                size={responsive.moderateScaleForIcon(iconSizes.lg)}
                color={colors.success}
              />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {t('storyPlayer.autoSleepNoise')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TimerModal
        visible={showTimerModal}
        timerDuration={timerDuration}
        onSelect={handleTimerSelect}
        onCancel={() => setShowTimerModal(false)}
        onCancelTimer={handleCancelTimer}
      />

      {playerError && <ErrorToast visible={true} message={playerError} onDismiss={clearError} />}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: spacing.xs,
  },
  bufferingText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  contentSection: {
    flex: 1,
  },
  controlsSection: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    marginHorizontal: spacing.sm,
    textAlign: 'center',
  },
  landscapeContainer: {
    flexDirection: 'row',
  },
  landscapeContent: {
    flex: 2,
    justifyContent: 'center',
    paddingRight: spacing.lg,
  },
  landscapeControls: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  landscapeSecondaryControls: {
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
  },
  mainLayout: {
    flex: 1,
  },
  moreButton: {
    padding: spacing.xs,
  },
  portraitContainer: {
    flexDirection: 'column',
  },
  portraitContent: {
    flex: 1,
  },
  portraitControls: {
    flex: 1,
  },
  progressBar: {
    height: responsive.verticalScale(40),
    width: '100%',
  },
  progressSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  secondaryButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  shareButtonContainer: {
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timeText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  timerButtonContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    marginTop: spacing.xs,
  },
  tipCard: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    margin: spacing.xl,
    minWidth: '80%',
    padding: spacing.lg,
    ...shadows.large,
  },
  tipText: {
    flexWrap: 'wrap',
    flex: 1,
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    textAlign: 'center',
  },
});
