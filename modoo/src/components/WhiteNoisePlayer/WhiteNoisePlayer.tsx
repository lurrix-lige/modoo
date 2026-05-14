import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  LayoutChangeEvent,
  GestureResponderEvent,
  Animated,
} from 'react-native';
import {
  Music,
  Pause,
  Play,
  AlarmClock,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Flame,
  TreeDeciduous,
  Bird,
  Coffee,
  Wind,
  AlertCircle,
  X,
  Crown,
  RotateCw,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, responsive, iconSizes } from '../../theme';
import { apiService, WhiteNoise } from '../../services';
import { errorHandler } from '../../services/ErrorHandler';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useSleepTimer } from '../../features/player/hooks/useSleepTimer';
import { TimerModal } from '../TimerModal';
import { WhiteNoisePlayerProps } from './types';

const defaultIconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'cloud-rain': CloudRain,
  'waves': Waves,
  'flame': Flame,
  'tree-deciduous': TreeDeciduous,
  'bird': Bird,
  'birds': Bird,
  'coffee': Coffee,
  'wind': Wind,
  'music': Music,
};

export default function WhiteNoisePlayer({
  platform = 'parent',
  allowMultiple = true,
  showVolumeControl = true,
  showSleepTimer = true,
  sectionTitle,
  noises: externalNoises,
  renderNoiseIcon,
  renderHeader,
  renderFooter,
  onActiveNoisesChange,
  onPlaybackStateChange,
  onVolumeChange,
  onTimerExpire,
  onError,
  children,
}: WhiteNoisePlayerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    activeTrackIds,
    isPlaying,
    volume,
    addTrack,
    removeTrack,
    stop,
    setVolume,
    pauseTrack,
    resumeTrack,
  } = useAudioPlayer();

  const isChild = platform === 'child';

  // Data state
  const [noises, setNoises] = useState<WhiteNoise[]>(externalNoises ?? []);
  const [isLoading, setIsLoading] = useState(!externalNoises);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track ID to noise mapping for callbacks
  const noisesRef = useRef<Map<string, WhiteNoise>>(new Map());

  // Track manually paused noises (user clicked pause on these, not removed by other means).
  // When a paused noise is resumed, it's re-added to the player via addTrack.
  const [pausedTrackIds, setPausedTrackIds] = useState<Set<string>>(new Set());
  const pausedRef = useRef<Set<string>>(new Set());

  // Track which active noise card the user last interacted with.
  // That card shows the Pause/Play button; other playing cards show the rotating indicator.
  const [focusedTrackId, setFocusedTrackId] = useState<string | null>(null);

  // Volume bar — Animated.Value for smooth native-performance tracking.
  // We update the animated value directly in gesture callbacks (no setState)
  // and commit the final volume to useAudioPlayer only on gesture release.
  const volumeAnim = useRef(new Animated.Value(volume)).current;
  const volumeValRef = useRef(volume);
  const setVolumeRef = useRef(setVolume);
  setVolumeRef.current = setVolume;
  const [volumeBarWidth, setVolumeBarWidth] = useState(0);
  const volumeBarWidthRef = useRef(0);
  const volumeBarRef = useRef<View>(null);

  // Keep animated value in sync when volume changes from outside (e.g. external setVolume)
  useEffect(() => {
    volumeAnim.setValue(volume);
    volumeValRef.current = volume;
  }, [volume, volumeAnim]);

  // --- Data fetching ---
  const fetchNoises = useCallback(async () => {
    if (externalNoises) {
      setNoises(externalNoises);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await apiService.getWhiteNoises();
      setNoises(response.noises);
    } catch (error) {
      const message = errorHandler.getErrorMessage(
        error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        t('whiteNoise.loadError'),
      );
      setLoadError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [externalNoises, t, onError]);

  useEffect(() => {
    fetchNoises();
  }, [fetchNoises]);

  // Keep noises ref in sync
  useEffect(() => {
    const map = new Map<string, WhiteNoise>();
    noises.forEach((n) => map.set(n.id, n));
    noisesRef.current = map;
  }, [noises]);

  // --- Sleep timer ---
  const handleTimerExpire = useCallback(() => {
    stop();
    onTimerExpire?.();
  }, [stop, onTimerExpire]);

  const {
    timerDuration,
    timerRemainingSeconds,
    showTimerModal,
    setShowTimerModal,
    handleTimerSelect,
    handleCancelTimer,
    formatTimerRemaining,
  } = useSleepTimer(handleTimerExpire);

  // --- Noise name resolution ---
  const getNoiseName = useCallback(
    (noise: WhiteNoise) => {
      if (noise.nameKey) return t(noise.nameKey);
      if (noise.name) return noise.name;
      return t(`whiteNoise.${noise.id}`) || noise.id;
    },
    [t],
  );

  // --- Per-noise play/pause ---
  // Top-right button handler: pause/resume + focus management
  const handleNoisePlayPause = useCallback(
    async (noise: WhiteNoise) => {
      const noiseUrl = noise.audioUrl;
      if (!noiseUrl) return;

      const isCurrentlyPlaying = activeTrackIds.includes(noise.id) && !pausedTrackIds.has(noise.id);
      const isCurrentlyPaused = activeTrackIds.includes(noise.id) && pausedTrackIds.has(noise.id);

      if (isCurrentlyPlaying) {
        // Playing → pause
        pauseTrack(noise.id);
        setPausedTrackIds((prev) => {
          const next = new Set(prev);
          next.add(noise.id);
          return next;
        });
        setFocusedTrackId((prev) => (prev === noise.id ? null : prev));
      } else if (isCurrentlyPaused) {
        // Paused → resume + focus
        setPausedTrackIds((prev) => {
          const next = new Set(prev);
          next.delete(noise.id);
          return next;
        });

        if (!allowMultiple && activeTrackIds.length > 0) {
          for (const id of activeTrackIds) {
            if (id !== noise.id) {
              await removeTrack(id);
            }
          }
        }

        const success = await resumeTrack(noise.id);
        if (success) {
          setFocusedTrackId(noise.id);
        } else {
          onError?.(t('whiteNoise.playError'));
        }
      } else {
        // Inactive → start new track + focus
        if (!allowMultiple && activeTrackIds.length > 0) {
          for (const id of activeTrackIds) {
            await removeTrack(id);
          }
        }

        const success = await addTrack(noise.id, noiseUrl);
        if (success) {
          setFocusedTrackId(noise.id);
        } else {
          onError?.(t('whiteNoise.playError'));
        }
      }
    },
    [activeTrackIds, allowMultiple, addTrack, removeTrack, pauseTrack, resumeTrack, pausedTrackIds, t, onError],
  );

  // --- Noise toggle (card body press) ---
  // Card body = play/stop toggle: playing → stop, otherwise → start/resume
  const handleNoisePlayPauseRef = useRef(handleNoisePlayPause);
  handleNoisePlayPauseRef.current = handleNoisePlayPause;

  const handleNoiseToggle = useCallback(
    async (noise: WhiteNoise) => {
      const noiseUrl = noise.audioUrl;
      if (!noiseUrl) return;

      const isActive = activeTrackIds.includes(noise.id);
      const isPaused = pausedTrackIds.has(noise.id);
      const isActuallyPlaying = isActive && !isPaused;

      if (isActuallyPlaying) {
        // Playing (focused or background) → stop
        await removeTrack(noise.id);
        setPausedTrackIds((prev) => {
          const next = new Set(prev);
          next.delete(noise.id);
          return next;
        });
        setFocusedTrackId((prev) => (prev === noise.id ? null : prev));
      } else {
        // Paused / Inactive → delegate to play/pause handler
        await handleNoisePlayPauseRef.current(noise);
      }
    },
    [activeTrackIds, focusedTrackId, pausedTrackIds, removeTrack],
  );

  // Keep pausedRef in sync for use in callbacks that can't depend on state
  useEffect(() => {
    pausedRef.current = pausedTrackIds;
  }, [pausedTrackIds]);

  // Prune stale pausedTrackIds when tracks are removed externally
  // (e.g. single-track mode batch removal, timer expire, etc.)
  useEffect(() => {
    setPausedTrackIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      let changed = false;
      for (const id of prev) {
        if (!activeTrackIds.includes(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeTrackIds]);

  // --- Active noises callback ---
  useEffect(() => {
    const active = activeTrackIds
      .map((id) => noisesRef.current.get(id))
      .filter(Boolean) as WhiteNoise[];
    onActiveNoisesChange?.(active);
  }, [activeTrackIds, onActiveNoisesChange]);

  // Auto-focus: when the focused track disappears but others are still active,
  // pick the first remaining active track as the new focus.
  useEffect(() => {
    if (activeTrackIds.length === 0) {
      setFocusedTrackId(null);
      return;
    }
    if (focusedTrackId && !activeTrackIds.includes(focusedTrackId)) {
      setFocusedTrackId(activeTrackIds[0]);
    }
  }, [activeTrackIds, focusedTrackId]);

  // --- Playback state callback ---
  useEffect(() => {
    onPlaybackStateChange?.(isPlaying);
  }, [isPlaying, onPlaybackStateChange]);

  // --- Volume change callback ---
  useEffect(() => {
    onVolumeChange?.(volume);
  }, [volume, onVolumeChange]);

  // --- Volume bar interaction ---
  // Direction-aware so vertical scrolls pass through to parent ScrollView.
  const volumePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gs: { dx: number; dy: number }) => {
        return Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 5;
      },
      onPanResponderGrant: (evt) => {
        const w = volumeBarWidthRef.current;
        if (w <= 0) return;
        const newVol = Math.max(0, Math.min(1, evt.nativeEvent.locationX / w));
        volumeValRef.current = newVol;
        volumeAnim.setValue(newVol);
      },
      onPanResponderMove: (evt) => {
        const w = volumeBarWidthRef.current;
        if (w <= 0) return;
        const newVol = Math.max(0, Math.min(1, evt.nativeEvent.locationX / w));
        volumeValRef.current = newVol;
        volumeAnim.setValue(newVol);
      },
      onPanResponderRelease: () => {
        setVolumeRef.current(volumeValRef.current);
      },
      onPanResponderTerminate: () => {
        setVolumeRef.current(volumeValRef.current);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const handleVolumeBarLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    volumeBarWidthRef.current = w;
    setVolumeBarWidth(w);
  }, []);

  // --- Now-playing spin animation ---
  // Create the animated value, interpolation, and loop exactly once.
  // Only start/stop the loop based on playback state — never recreate it.
  const spinAnim = useRef(new Animated.Value(0)).current;

  const spin = useRef(
    spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }),
  ).current;

  const spinLoop = useRef(
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ),
  ).current;

  const spinLoopRunning = useRef(false);

  useEffect(() => {
    const hasPlayingTracks = activeTrackIds.some((id) => !pausedTrackIds.has(id));
    if (hasPlayingTracks && !spinLoopRunning.current) {
      spinLoopRunning.current = true;
      spinLoop.start();
    } else if (!hasPlayingTracks && spinLoopRunning.current) {
      spinLoopRunning.current = false;
      spinLoop.stop();
      spinAnim.setValue(0);
    }
  }, [activeTrackIds, pausedTrackIds, spinAnim, spinLoop]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // --- Timer formatting ---
  const timerDisplay = formatTimerRemaining((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  // --- Styling helpers ---
  const fontSize = useCallback(
    (size: number) => (isChild ? responsive.scaledFontSize(size) : size),
    [isChild],
  );

  const iconSize = useCallback(
    (size: number) => (isChild ? responsive.moderateScale(size) : size),
    [isChild],
  );

  // --- Render helpers ---
  const renderIcon = (noise: WhiteNoise, isActive: boolean) => {
    if (renderNoiseIcon) {
      return renderNoiseIcon(noise, isActive);
    }

    if (isActive) {
      // 播放中：显示旋转的 RotateCw 图标
      return (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <RotateCw size={iconSize(36)} color={commonColors.white} />
        </Animated.View>
      );
    }

    // 未播放：显示原来的噪音图标
    const iconKey = noise.icon ?? '';
    const IconComp = defaultIconMap[iconKey] || Music;
    const iconColor = noise.color || colors.textPrimary;

    return <IconComp size={iconSize(36)} color={iconColor} />;
  };

  // --- Animated interpolations for volume slider ---
  const fillWidth = volumeBarWidth > 0
    ? volumeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, volumeBarWidth],
        extrapolate: 'clamp',
      })
    : 0;

  const thumbTranslate = volumeBarWidth > 0
    ? volumeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.max(0, volumeBarWidth - 16)],
        extrapolate: 'clamp',
      })
    : 0;

  // --- Loading skeleton ---
  if (isLoading) {
    return (
      <View style={styles.section}>
        {renderHeader?.()}
        <View style={styles.noiseGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.noiseCard, styles.skeletonCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
              <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // --- Error state ---
  if (loadError) {
    return (
      <View style={styles.section}>
        {renderHeader?.()}
        <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
          <AlertCircle size={iconSize(48)} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textPrimary, fontSize: fontSize(typography.fontSize.md) }]}>
            {loadError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchNoises}
          >
            <Text style={[styles.retryButtonText, { color: commonColors.white }]}>
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Empty state ---
  if (noises.length === 0) {
    return (
      <View style={styles.section}>
        {renderHeader?.()}
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Music size={iconSize(48)} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textPrimary, fontSize: fontSize(typography.fontSize.md) }]}>
            {t('whiteNoise.empty')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {renderHeader?.()}

      {/* Section title */}
      {sectionTitle !== undefined ? (
        sectionTitle ? (
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize(typography.fontSize.lg) }]}>
            {sectionTitle}
          </Text>
        ) : null
      ) : (
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: fontSize(typography.fontSize.lg) }]}>
          {t('whiteNoise.title')}
        </Text>
      )}

      {/* Noise grid */}
      <View style={styles.noiseGrid}>
        {noises.map((noise) => {
          const isActive = activeTrackIds.includes(noise.id);
          const isPaused = pausedTrackIds.has(noise.id);
          const isActuallyPlaying = isActive && !isPaused;
          const isFocused = isActuallyPlaying && noise.id === focusedTrackId;
          const isBackground = isActuallyPlaying && noise.id !== focusedTrackId;
          const showPlayPause = isActuallyPlaying || isPaused;

          return (
            <TouchableOpacity
              key={noise.id}
              style={[
                styles.noiseCard,
                {
                  backgroundColor: isActuallyPlaying ? noise.color || colors.surface : colors.surface,
                },
              ]}
              onPress={() => handleNoiseToggle(noise)}
              activeOpacity={0.7}
            >
              {/* Premium crown — top-left corner */}
              {noise.isPremium && (
                <View style={styles.premiumCrown}>
                  <Crown size={iconSize(16)} color={colors.warning} />
                </View>
              )}

              {renderIcon(noise, isActuallyPlaying)}
              <Text
                style={[
                  styles.noiseName,
                  {
                    color: isActuallyPlaying ? commonColors.white : colors.textPrimary,
                    fontSize: fontSize(typography.fontSize.md),
                  },
                ]}
                numberOfLines={2}
              >
                {getNoiseName(noise)}
              </Text>

              {/* Top-right indicator */}
              {showPlayPause && (
                <TouchableOpacity
                  style={[
                    styles.playPauseButton,
                    { backgroundColor: isActuallyPlaying ? colors.primary : colors.success },
                  ]}
                  onPress={() => {
                    if (isBackground) {
                      setFocusedTrackId(noise.id);
                    } else {
                      handleNoisePlayPause(noise);
                    }
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.8}
                >
                  {/* Focused active card: Pause button */}
                  {isFocused && (
                    <Pause size={iconSize(14)} color={commonColors.white} />
                  )}
                  {/* Background playing card: rotating indicator */}
                  {isBackground && (
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <RotateCw size={iconSize(14)} color={commonColors.white} />
                    </Animated.View>
                  )}
                  {/* Paused card: Play button */}
                  {isPaused && (
                    <Play size={iconSize(14)} color={commonColors.white} />
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {children}

      {/* Unified controls panel */}
      {(showVolumeControl || showSleepTimer) && (
        <View style={[styles.controlPanel, { backgroundColor: colors.surface }]}>
          {/* Volume section */}
          {showVolumeControl && (
            <View style={styles.controlSection}>
              <View style={styles.controlSectionHeader}>
                {volume > 0 ? (
                  <Volume2 size={iconSize(iconSizes.md)} color={colors.textSecondary} />
                ) : (
                  <VolumeX size={iconSize(iconSizes.md)} color={colors.textSecondary} />
                )}
                <Text style={[styles.controlSectionLabel, { color: colors.textSecondary, fontSize: fontSize(typography.fontSize.sm) }]}>
                  {t('whiteNoise.volume')}
                </Text>
                <Text style={[styles.volumePercent, { color: colors.textSecondary, fontSize: fontSize(typography.fontSize.sm) }]}>
                  {Math.round(volume * 100)}%
                </Text>
              </View>
              <View
                ref={volumeBarRef}
                style={[styles.sliderTrack, { backgroundColor: colors.border }]}
                onLayout={handleVolumeBarLayout}
                {...volumePanResponder.panHandlers}
              >
                <Animated.View style={[styles.sliderFill, { backgroundColor: colors.primary, width: fillWidth }]} />
                <Animated.View style={[styles.sliderThumb, { backgroundColor: colors.primary, transform: [{ translateX: thumbTranslate }] }]} />
              </View>
            </View>
          )}

          {/* Divider */}
          {showVolumeControl && showSleepTimer && (
            <View style={[styles.controlDivider, { backgroundColor: colors.borderLight }]} />
          )}

          {/* Timer section */}
          {showSleepTimer && (
            <View style={styles.controlSection}>
              <TouchableOpacity
                style={styles.controlSectionHeader}
                onPress={() => setShowTimerModal(true)}
                activeOpacity={0.7}
              >
                <AlarmClock size={iconSize(iconSizes.md)} color={colors.textSecondary} />
                <Text style={[styles.controlSectionLabel, { color: colors.textSecondary, fontSize: fontSize(typography.fontSize.sm) }]}>
                  {t('whiteNoise.sleepTimer')}
                </Text>
              </TouchableOpacity>

              {timerRemainingSeconds !== null ? (
                <View style={[styles.timerActivePill, { backgroundColor: colors.primaryLight }]}>
                  <AlarmClock size={iconSize(16)} color={colors.primaryDark} />
                  <Text style={[styles.timerActiveText, { color: colors.primaryDark, fontSize: fontSize(typography.fontSize.md) }]}>
                    {timerDisplay}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCancelTimer}
                    style={styles.timerActiveCancel}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={iconSize(16)} color={colors.primaryDark} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.timerSetButton, { borderColor: colors.border }]}
                  onPress={() => setShowTimerModal(true)}
                  activeOpacity={0.7}
                >
                  <AlarmClock size={iconSize(16)} color={colors.primary} />
                  <Text style={[styles.timerSetText, { color: colors.primary, fontSize: fontSize(typography.fontSize.sm) }]}>
                    {t('whiteNoise.setTimer')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Sleep timer modal */}
      <TimerModal
        visible={showTimerModal}
        timerDuration={timerDuration ?? null}
        timerOptions={[15, 30, 60, 90]}
        onSelect={handleTimerSelect}
        onCancel={() => setShowTimerModal(false)}
        onCancelTimer={handleCancelTimer}
      />

      {renderFooter?.()}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
  },
  noiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  noiseCard: {
    width: '47%',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.small,
    position: 'relative',
  },
  noiseName: {
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  playPauseButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumCrown: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },

  // Controls panel — unified card
  controlPanel: {
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
    ...shadows.medium,
    overflow: 'hidden',
  },
  controlSection: {
    padding: spacing.lg,
  },
  controlSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  controlSectionLabel: {
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  controlDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },

  // Volume slider
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    left: 0,
    top: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    top: -5,
    left: 0,
  },
  volumePercent: {
    fontWeight: typography.fontWeight.semibold,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
    textAlign: 'right',
  },

  // Timer
  timerActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  timerActiveText: {
    fontWeight: typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
    flex: 1,
    textAlign: 'center',
  },
  timerActiveCancel: {
    padding: spacing.xs,
  },
  timerSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  timerSetText: {
    fontWeight: typography.fontWeight.semibold,
  },

  // Skeleton
  skeletonCard: {},
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  skeletonName: {
    width: 70,
    height: 14,
    borderRadius: 7,
    marginTop: spacing.sm,
  },

  // Error
  errorCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    ...shadows.medium,
  },
  errorText: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    fontWeight: typography.fontWeight.semibold,
  },

  // Empty
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    ...shadows.medium,
  },
  emptyText: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
