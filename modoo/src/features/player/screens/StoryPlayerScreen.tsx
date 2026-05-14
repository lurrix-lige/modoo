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
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChildrenStackParamList } from '../../../navigation/types';
import { ErrorToast, SafeAreaContainer } from '../../../components';
import { usePictureInPicture } from '../../../hooks/usePictureInPicture';
import { logger } from '../../../utils/logger';
import { StoryInfo } from '../components/StoryInfo';
import { PlayerControls } from '../components/PlayerControls';
import { TimerModal } from '../components/TimerModal';
import { useTheme, spacing, borderRadius, typography, responsive, iconSizes, shadows, commonColors } from '../../../theme';
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
  const { isPlaying, isBuffering, progress, duration, isLoading, story, error: playerError, resume, pause, stop, seekTo, skipForward, skipBackward, toggleFavorite, clearError } = usePlayer(route.params?.storyId);
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

  const { isAvailable: isPiPAvailable, isActive: isPiPActive, togglePiP } = usePictureInPicture({
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
      await shareNative({
        title: story?.title || '',
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
  const currentProgress = Math.min(progress || 0, maxDuration);

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
              <ArrowLeft size={responsive.moderateScale(iconSizes.xl)} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {story.title}
            </Text>
            <View style={styles.headerActions}>
              {isPiPAvailable && (
                <TouchableOpacity style={styles.headerButton} onPress={togglePiP}>
                  <PictureInPicture
                    size={responsive.moderateScale(iconSizes.lg)}
                    color={isPiPActive ? colors.primary : colors.textPrimary}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.moreButton}>
                <MoreHorizontal
                  size={responsive.moderateScale(iconSizes.lg)}
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
              onSlidingComplete={seekTo}
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

          <View style={[styles.secondaryControls, isLandscapeMode && styles.landscapeSecondaryControls]}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleFavorite}>
              <Heart
                size={responsive.moderateScale(iconSizes.lg)}
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
                  size={responsive.moderateScale(iconSizes.lg)}
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
                    size={responsive.moderateScale(iconSizes.lg)}
                    color={colors.success}
                  />
                ) : (
                  <Share2
                    size={responsive.moderateScale(iconSizes.lg)}
                    color={colors.textSecondary}
                  />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={toggleOrientation}>
              <RotateCcw
                size={responsive.moderateScale(iconSizes.lg)}
                color={isLandscape ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={toggleBrightness}>
              <Sun
                size={responsive.moderateScale(iconSizes.lg)}
                color={isNightMode ? colors.primary : colors.textSecondary}
                fill={isNightMode ? colors.primary : 'none'}
              />
            </TouchableOpacity>
          </View>

          {!isLandscapeMode && (
            <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
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

      {playerError && (
        <ErrorToast
          visible={true}
          message={playerError}
          onDismiss={clearError}
        />
      )}
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainLayout: {
    flex: 1,
  },
  portraitContainer: {
    flexDirection: 'column',
  },
  landscapeContainer: {
    flexDirection: 'row',
  },
  contentSection: {
    flex: 1,
  },
  portraitContent: {
    flex: 1,
  },
  landscapeContent: {
    flex: 1.8,
    justifyContent: 'center',
    paddingRight: spacing.lg,
  },
  controlsSection: {
    justifyContent: 'center',
  },
  portraitControls: {
    flex: 0,
  },
  landscapeControls: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  headerButton: {
    padding: spacing.xs,
  },
  moreButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: responsive.scaledFontSize(typography.fontSize.lg),
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.md),
  },
  progressSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  progressBar: {
    width: '100%',
    height: responsive.verticalScale(40),
  },
  bufferingText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  timeText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  landscapeSecondaryControls: {
    marginTop: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  secondaryButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  timerButtonContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.xs),
    marginTop: spacing.xs,
  },
  shareButtonContainer: {
    alignItems: 'center',
  },
  tipCard: {
    margin: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    alignSelf: 'center',
    minWidth: '80%',
    ...shadows.large,
  },
  tipText: {
    fontSize: responsive.scaledFontSize(typography.fontSize.sm),
    textAlign: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
});
