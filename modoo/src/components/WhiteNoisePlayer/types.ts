import { WhiteNoise } from '../../services';

export type PlatformVariant = 'parent' | 'child';

export interface WhiteNoisePlayerProps {
  /** Platform variant for adaptive styling: 'parent' or 'child' */
  platform?: PlatformVariant;

  /** Allow multiple white noises to play simultaneously */
  allowMultiple?: boolean;

  /** Show volume control slider */
  showVolumeControl?: boolean;

  /** Show sleep timer controls */
  showSleepTimer?: boolean;

  /** Section title override; falls back to i18n key */
  sectionTitle?: string;

  /** Pre-fetched noise data; component fetches from API if not provided */
  noises?: WhiteNoise[];

  /** Custom noise icon renderer */
  renderNoiseIcon?: (noise: WhiteNoise, isActive: boolean) => React.ReactNode;

  /** Custom header rendered above the noise grid */
  renderHeader?: () => React.ReactNode;

  /** Custom footer rendered below the noise grid */
  renderFooter?: () => React.ReactNode;

  /** Fires when active noises change */
  onActiveNoisesChange?: (noises: WhiteNoise[]) => void;

  /** Fires when playback state changes */
  onPlaybackStateChange?: (isPlaying: boolean) => void;

  /** Fires when volume changes */
  onVolumeChange?: (volume: number) => void;

  /** Fires when sleep timer expires (all noises stop) */
  onTimerExpire?: () => void;

  /** Fires on load or playback error */
  onError?: (error: string) => void;

  /** Additional content to render between the noise grid and controls */
  children?: React.ReactNode;
}
