import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  PanResponder,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import {
  Music,
  Pause,
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
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, borderRadius, typography, shadows, commonColors, responsive } from '../../theme';
import { apiService, WhiteNoise } from '../../services';
import { errorHandler } from '../../services/ErrorHandler';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useSleepTimer } from '../../features/player/hooks/useSleepTimer';
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

const TIMER_OPTIONS = [15, 30, 60, 90];

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
  } = useAudioPlayer();

  const isChild = platform === 'child';

  // Data state
  const [noises, setNoises] = useState<WhiteNoise[]>(externalNoises ?? []);
  const [isLoading, setIsLoading] = useState(!externalNoises);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track ID to noise mapping for callbacks
  const noisesRef = useRef<Map<string, WhiteNoise>>(new Map());

  // Volume bar layout
  const [volumeBarWidth, setVolumeBarWidth] = useState(0);
  const volumeBarRef = useRef<View>(null);

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

  // --- Noise toggle ---
  const handleNoiseToggle = useCallback(
    async (noise: WhiteNoise) => {
      const noiseUrl = noise.audioUrl;
      if (!noiseUrl) return;

      if (activeTrackIds.includes(noise.id)) {
        await removeTrack(noise.id);
      } else {
        if (!allowMultiple && activeTrackIds.length > 0) {
          for (const id of activeTrackIds) {
            await removeTrack(id);
          }
        }

        const success = await addTrack(noise.id, noiseUrl);
        if (!success) {
          const msg = t('whiteNoise.playError');
          onError?.(msg);
        }
      }
    },
    [activeTrackIds, allowMultiple, addTrack, removeTrack, t, onError],
  );

  // --- Active noises callback ---
  useEffect(() => {
    const active = activeTrackIds
      .map((id) => noisesRef.current.get(id))
      .filter(Boolean) as WhiteNoise[];
    onActiveNoisesChange?.(active);
  }, [activeTrackIds, onActiveNoisesChange]);

  // --- Playback state callback ---
  useEffect(() => {
    onPlaybackStateChange?.(isPlaying);
  }, [isPlaying, onPlaybackStateChange]);

  // --- Volume change callback ---
  useEffect(() => {
    onVolumeChange?.(volume);
  }, [volume, onVolumeChange]);

  // --- Volume bar interaction ---
  // Track gesture origin so we only claim horizontal drags and let vertical
  // scrolls pass through to the parent ScrollView.
  const volumeGestureStart = useRef<{ x: number; y: number } | null>(null);

  const volumePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gs: { dx: number; dy: number }) => {
        // Only claim the gesture if the user is dragging primarily horizontally
        return Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 5;
      },
      onPanResponderGrant: (evt) => {
        volumeGestureStart.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
        updateVolumeFromTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        updateVolumeFromTouch(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        volumeGestureStart.current = null;
      },
      onPanResponderTerminate: () => {
        volumeGestureStart.current = null;
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const updateVolumeFromTouch = useCallback(
    (x: number) => {
      if (volumeBarWidth <= 0) return;
      const newVol = Math.max(0, Math.min(1, x / volumeBarWidth));
      setVolume(newVol);
    },
    [volumeBarWidth, setVolume],
  );

  const handleVolumeBarLayout = useCallback((e: LayoutChangeEvent) => {
    setVolumeBarWidth(e.nativeEvent.layout.width);
  }, []);

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

    const iconKey = noise.icon ?? '';
    const IconComp = defaultIconMap[iconKey] || Music;
    const iconColor = isActive ? commonColors.white : noise.color || colors.textPrimary;

    return <IconComp size={iconSize(36)} color={iconColor} />;
  };

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
          return (
            <TouchableOpacity
              key={noise.id}
              style={[
                styles.noiseCard,
                {
                  backgroundColor: isActive ? noise.color || colors.surface : colors.surface,
                },
              ]}
              onPress={() => handleNoiseToggle(noise)}
              activeOpacity={0.7}
            >
              {renderIcon(noise, isActive)}
              <Text
                style={[
                  styles.noiseName,
                  {
                    color: isActive ? commonColors.white : colors.textPrimary,
                    fontSize: fontSize(typography.fontSize.md),
                  },
                ]}
                numberOfLines={2}
              >
                {getNoiseName(noise)}
              </Text>
              {isActive && (
                <View style={[styles.playingIndicator, { backgroundColor: colors.success }]}>
                  <Pause size={iconSize(16)} color={commonColors.white} />
                </View>
              )}
              {noise.isPremium && (
                <Text style={[styles.premiumBadge, { color: colors.warning, fontSize: fontSize(typography.fontSize.xs) }]}>
                  {t('common.premium')}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {children}

      {/* Volume control */}
      {showVolumeControl && (
        <View style={[styles.controlRow, { backgroundColor: colors.surface }]}>
          <View style={styles.controlLabel}>
            {volume > 0 ? (
              <Volume2 size={iconSize(20)} color={colors.textSecondary} />
            ) : (
              <VolumeX size={iconSize(20)} color={colors.textSecondary} />
            )}
            <Text style={[styles.controlLabelText, { color: colors.textSecondary, fontSize: fontSize(typography.fontSize.sm) }]}>
              {t('whiteNoise.volume')}
            </Text>
          </View>
          <View
            ref={volumeBarRef}
            style={[styles.volumeBar, { backgroundColor: colors.border }]}
            onLayout={handleVolumeBarLayout}
            {...volumePanResponder.panHandlers}
          >
            <View
              style={[
                styles.volumeFill,
                {
                  backgroundColor: colors.primary,
                  width: volume * volumeBarWidth,
                },
              ]}
            />
            <View
              style={[
                styles.volumeThumb,
                {
                  backgroundColor: colors.primary,
                  left: volume * volumeBarWidth - 8,
                },
              ]}
            />
          </View>
          <Text style={[styles.volumePercent, { color: colors.textSecondary, fontSize: fontSize(typography.fontSize.sm) }]}>
            {Math.round(volume * 100)}%
          </Text>
        </View>
      )}

      {/* Sleep timer */}
      {showSleepTimer && (
        <View style={[styles.controlRow, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.controlLabel}
            onPress={() => setShowTimerModal(true)}
          >
            <AlarmClock size={iconSize(20)} color={colors.textSecondary} />
            <Text style={[styles.controlLabelText, { color: colors.textSecondary, fontSize: fontSize(typography.fontSize.sm) }]}>
              {t('whiteNoise.sleepTimer')}
            </Text>
          </TouchableOpacity>

          {timerRemainingSeconds !== null ? (
            <View style={styles.timerActive}>
              <Text style={[styles.timerText, { color: colors.primary, fontSize: fontSize(typography.fontSize.sm) }]}>
                {timerDisplay}
              </Text>
              <TouchableOpacity onPress={handleCancelTimer}>
                <Text style={[styles.timerCancel, { color: colors.error, fontSize: fontSize(typography.fontSize.xs) }]}>
                  {t('whiteNoise.cancelTimer')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowTimerModal(true)}>
              <Text style={[styles.timerSetText, { color: colors.primary, fontSize: fontSize(typography.fontSize.sm) }]}>
                {t('whiteNoise.setTimer')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sleep timer modal */}
      <Modal
        visible={showTimerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimerModal(false)}
      >
        <TouchableOpacity
          style={styles.timerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimerModal(false)}
        >
          <View
            style={[styles.timerModal, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.timerModalTitle, { color: colors.textPrimary, fontSize: fontSize(typography.fontSize.lg) }]}>
              {t('whiteNoise.sleepTimerTitle')}
            </Text>
            <View style={styles.timerOptions}>
              {TIMER_OPTIONS.map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[styles.timerOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handleTimerSelect(mins)}
                >
                  <Text style={[styles.timerOptionText, { color: colors.textPrimary, fontSize: fontSize(typography.fontSize.md) }]}>
                    {mins} {t('whiteNoise.minutes')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.timerCancelButton, { borderTopColor: colors.border }]}
              onPress={() => setShowTimerModal(false)}
            >
              <Text style={[styles.timerCancelButtonText, { color: colors.textSecondary, fontSize: fontSize(typography.fontSize.md) }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
  playingIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
  },

  // Controls
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    ...shadows.small,
  },
  controlLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlLabelText: {
    fontWeight: typography.fontWeight.medium,
  },

  // Volume
  volumeBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: spacing.md,
    position: 'relative',
    justifyContent: 'center',
  },
  volumeFill: {
    height: 6,
    borderRadius: 3,
  },
  volumeThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  volumePercent: {
    minWidth: 36,
    textAlign: 'right',
  },

  // Timer
  timerActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timerText: {
    fontWeight: typography.fontWeight.semibold,
  },
  timerCancel: {
    fontWeight: typography.fontWeight.medium,
  },
  timerSetText: {
    fontWeight: typography.fontWeight.medium,
  },

  // Timer modal
  timerModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  timerModal: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.xl,
    ...shadows.large,
  },
  timerModalTitle: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  timerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  timerOption: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  timerOptionText: {
    fontWeight: typography.fontWeight.medium,
  },
  timerCancelButton: {
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  timerCancelButtonText: {
    fontWeight: typography.fontWeight.medium,
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
