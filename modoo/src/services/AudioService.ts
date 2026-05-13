import { createAudioPlayer, setAudioModeAsync, AudioStatus, AudioPlayer } from 'expo-audio';
import { usePlayerStore } from '../store';
import { Story } from '../types';
import i18n from '../i18n';
import { logger } from '../utils/logger';

const PLAYBACK_STATUS_UPDATE = 'playbackStatusUpdate';

class AudioService {
  private player: AudioPlayer | null = null;
  private isInitialized: boolean = false;

  async initialize() {
    if (this.isInitialized) return;
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: true,
    });
    this.isInitialized = true;
  }

  private async validateAudioUrl(url: string): Promise<boolean> {
    try {
      if (!url) {
        return false;
      }
      if (url.startsWith('http') || url.startsWith('file:')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async playStory(story: Story) {
    try {
      await this.initialize();

      const isValid = await this.validateAudioUrl(story.audioUrl);
      if (!isValid) {
        usePlayerStore.getState().setError(i18n.t('audio.invalidAudio'), 'INVALID_AUDIO_URL');
        logger.error('Invalid audio URL', { url: story.audioUrl });
        return;
      }

      if (this.player) {
        this.player.remove();
        this.player = null;
      }

      this.player = createAudioPlayer(story.audioUrl, {
        updateInterval: 100,
      });

      this.player.addListener(PLAYBACK_STATUS_UPDATE, (status: AudioStatus) => {
        if (!status.isLoaded) {
          return;
        }

        if (status.didJustFinish && !status.loop) {
          usePlayerStore.getState().stop();
          this.player?.remove();
          this.player = null;
        } else {
          usePlayerStore.getState().updateProgress(status.currentTime, status.duration);
        }
      });

      this.player.play();
      usePlayerStore.getState().play(story);
    } catch (error) {
      let errorMessage = i18n.t('audio.playbackFailed');
      let errorCode = 'PLAYBACK_ERROR';

      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('404')) {
          errorMessage = i18n.t('audio.audioNotFound');
          errorCode = 'FILE_NOT_FOUND';
        } else if (error.message.includes('timeout') || error.message.includes('408')) {
          errorMessage = i18n.t('audio.loadTimeout');
          errorCode = 'TIMEOUT';
        }
      }

      usePlayerStore.getState().setError(errorMessage, errorCode);
      logger.error('Failed to play story', { error });
    }
  }

  async pause() {
    try {
      if (this.player) {
        this.player.pause();
        usePlayerStore.getState().pause();
      }
    } catch (error) {
      logger.error('Failed to pause audio', { error });
    }
  }

  async resume() {
    try {
      if (this.player) {
        this.player.play();
        usePlayerStore.getState().resume();
      }
    } catch (error) {
      logger.error('Failed to resume audio', { error });
    }
  }

  async stop() {
    try {
      if (this.player) {
        this.player.remove();
        this.player = null;
      }
      usePlayerStore.getState().stop();
    } catch (error) {
      logger.error('Failed to stop audio', { error });
      usePlayerStore.getState().stop();
    }
  }

  async seekTo(position: number) {
    try {
      if (this.player) {
        await this.player.seekTo(position);
        usePlayerStore.getState().seekTo(position);
      }
    } catch (error) {
      logger.error('Failed to seek audio', { error });
    }
  }

  async setVolume(volume: number) {
    try {
      if (this.player) {
        this.player.volume = Math.max(0, Math.min(1, volume));
        usePlayerStore.getState().setVolume(volume);
      }
    } catch (error) {
      logger.error('Failed to set audio volume', { error });
    }
  }

  async fadeOut(duration: number = 30000) {
    if (!this.player) return;

    const steps = 30;
    const stepDuration = duration / steps;
    const currentVolume = usePlayerStore.getState().volume;
    const volumeStep = currentVolume / steps;
    let step = 0;

    return new Promise<void>((resolve) => {
      const interval = setInterval(async () => {
        step++;
        const newVolume = Math.max(0, currentVolume - (volumeStep * step));

        if (this.player) {
          this.player.volume = newVolume;
        }

        if (step >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  }

  async fadeIn(targetVolume: number = 1, duration: number = 1000) {
    if (!this.player) return;

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let step = 0;

    this.player.volume = 0;
    this.player.play();

    const interval = setInterval(async () => {
      step++;
      const newVolume = Math.min(targetVolume, volumeStep * step);

      if (this.player) {
        this.player.volume = newVolume;
      }

      if (step >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);
  }

  async playWhiteNoise(type: 'rain' | 'ocean' | 'wind' | 'stream') {
    const whiteNoiseUrls = {
      rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      ocean: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      wind: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      stream: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    };

    try {
      await this.initialize();

      if (this.player) {
        this.player.remove();
        this.player = null;
      }

      this.player = createAudioPlayer(whiteNoiseUrls[type], {
        updateInterval: 500,
      });
      
      this.player.loop = true;
      this.player.volume = 0.4;
      this.player.play();
    } catch (error) {
      logger.error('Failed to play white noise', { error });
      usePlayerStore.getState().setError(i18n.t('audio.whiteNoiseFailed'), 'WHITE_NOISE_ERROR');
    }
  }
}

export const audioService = new AudioService();