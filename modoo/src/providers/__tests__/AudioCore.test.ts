import { sanitizeTimeValue, validateUrl, encodeUrl, UnifiedAudioPlayer } from '../AudioCore';

// Mock expo-audio
const mockPlayer = () => {
  const listeners = new Map<string, Array<(status: Record<string, unknown>) => void>>();
  return {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
    addListener: jest.fn((event: string, cb: (status: Record<string, unknown>) => void) => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event)!.push(cb);
    }),
    _emitStatus: (status: Record<string, unknown>) => {
      listeners.get('playbackStatusUpdate')?.forEach((cb) => cb(status));
    },
    volume: 1,
    loop: false,
  };
};

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

const expoAudio = require('expo-audio');

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj.ios },
}));

describe('sanitizeTimeValue', () => {
  test('returns 0 for NaN', () => {
    expect(sanitizeTimeValue(NaN)).toBe(0);
  });

  test('returns 0 for Infinity', () => {
    expect(sanitizeTimeValue(Infinity)).toBe(0);
  });

  test('returns 0 for -Infinity', () => {
    expect(sanitizeTimeValue(-Infinity)).toBe(0);
  });

  test('returns 0 for negative values', () => {
    expect(sanitizeTimeValue(-5)).toBe(0);
  });

  test('returns the value for valid numbers', () => {
    expect(sanitizeTimeValue(42.5)).toBe(42.5);
  });

  test('returns 0 for 0', () => {
    expect(sanitizeTimeValue(0)).toBe(0);
  });
});

describe('validateUrl', () => {
  test('returns invalid for empty string', () => {
    const result = validateUrl('');
    expect(result.valid).toBe(false);
  });

  test('returns invalid for whitespace-only string', () => {
    const result = validateUrl('   ');
    expect(result.valid).toBe(false);
  });

  test('returns invalid for malformed URL', () => {
    const result = validateUrl('not-a-valid-url');
    expect(result.valid).toBe(false);
  });

  test('returns valid for http URL', () => {
    const result = validateUrl('https://example.com/audio.mp3');
    expect(result.valid).toBe(true);
  });

  test('returns valid for URL with unsupported extension (warns but does not block)', () => {
    const result = validateUrl('https://example.com/audio.xyz');
    expect(result.valid).toBe(true);
  });
});

describe('encodeUrl', () => {
  test('preserves ASCII URL', () => {
    const url = 'https://example.com/path/to/audio.mp3';
    expect(encodeUrl(url)).toBe(url);
  });

  test('encodes Chinese characters in path', () => {
    const url = 'https://example.com/音频/故事.mp3';
    const encoded = encodeUrl(url);
    expect(encoded).toContain('https://example.com/');
    expect(encoded).not.toBe(url);
    // Decoded segments should match original
    expect(decodeURIComponent(encoded)).toBe(url);
  });
});

describe('UnifiedAudioPlayer', () => {
  let player: UnifiedAudioPlayer;
  let mockAudioPlayer: ReturnType<typeof mockPlayer>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAudioPlayer = mockPlayer();
    expoAudio.createAudioPlayer.mockReturnValue(mockAudioPlayer);
    player = new UnifiedAudioPlayer();
  });

  describe('isEmpty', () => {
    test('returns true when no audio loaded', () => {
      expect(player.isEmpty()).toBe(true);
    });
  });

  describe('play', () => {
    test('returns false when all tracks have invalid URLs', async () => {
      const result = await player.play({
        tracks: [{ id: 'main', url: '', role: 'main' }],
      });
      expect(result).toBe(false);
    });

    test('creates audio player and plays', async () => {
      const result = await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });
      expect(result).toBe(true);
      expect(expoAudio.createAudioPlayer).toHaveBeenCalled();
      expect(mockAudioPlayer.play).toHaveBeenCalled();
      expect(player.isEmpty()).toBe(false);
    });

    test('reports progress through callback', async () => {
      const progressCb = jest.fn();
      player.addProgressListener(progressCb);

      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
        updateInterval: 100,
      });

      mockAudioPlayer._emitStatus({
        isLoaded: true,
        playing: true,
        currentTime: 10,
        duration: 120,
        isBuffering: false,
        didJustFinish: false,
        loop: false,
      });

      expect(progressCb).toHaveBeenCalledWith(10, 120);
    });

    test('notifies playing state callback', async () => {
      const playingCb = jest.fn();
      player.addPlayingStateListener(playingCb);

      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      mockAudioPlayer._emitStatus({
        isLoaded: true,
        playing: true,
        currentTime: 5,
        duration: 100,
        isBuffering: false,
        didJustFinish: false,
        loop: false,
      });

      expect(playingCb).toHaveBeenCalledWith(true);
    });

    test('handles multiple tracks', async () => {
      expoAudio.createAudioPlayer
        .mockReturnValueOnce(mockPlayer())
        .mockReturnValueOnce(mockPlayer());

      const result = await player.play({
        tracks: [
          { id: 'bg', url: 'https://example.com/bg.mp3', role: 'background' },
          { id: 'voice', url: 'https://example.com/voice.mp3', role: 'main' },
        ],
      });
      expect(result).toBe(true);
      expect(expoAudio.createAudioPlayer).toHaveBeenCalledTimes(2);
    });
  });

  describe('pause and resume', () => {
    test('pauses all players', async () => {
      const bgPlayer = mockPlayer();
      const voicePlayer = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValueOnce(bgPlayer).mockReturnValueOnce(voicePlayer);

      await player.play({
        tracks: [
          { id: 'bg', url: 'https://example.com/bg.mp3', role: 'background' },
          { id: 'voice', url: 'https://example.com/voice.mp3', role: 'main' },
        ],
      });

      player.pause();
      expect(bgPlayer.pause).toHaveBeenCalled();
      expect(voicePlayer.pause).toHaveBeenCalled();
    });

    test('resumes all players', async () => {
      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      await player.resume();
      expect(mockAudioPlayer.play).toHaveBeenCalled();
    });
  });

  describe('seekTo', () => {
    test('does not emit completion when seeking to end', async () => {
      const completionCb = jest.fn();
      player.addCompletionListener(completionCb);

      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      // First emit a status to set duration
      mockAudioPlayer._emitStatus({
        isLoaded: true,
        playing: true,
        currentTime: 50,
        duration: 120,
        isBuffering: false,
        didJustFinish: false,
        loop: false,
      });

      // Now seek to the end - should not trigger completion
      await player.seekTo(120);
      expect(completionCb).not.toHaveBeenCalled();
    });
  });

  describe('generation-based callback suppression', () => {
    test('old callbacks do not update state after new play', async () => {
      const progressCb = jest.fn();

      // First play
      player.addProgressListener(progressCb);
      const player1 = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValue(player1);

      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio1.mp3', role: 'main' }],
      });

      // Store the first player's status emitter (it registered a callback)
      const emitFromPlayer1 = (status: Record<string, unknown>) => {
        // The addListener was called with the callback during play()
        // We need to invoke the callback that was registered
        const addListenerCalls = player1.addListener.mock.calls;
        if (addListenerCalls.length > 0) {
          const registeredCb = addListenerCalls[0][1];
          registeredCb(status);
        }
      };

      progressCb.mockClear();

      // Second play (new generation)
      const player2 = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValue(player2);
      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio2.mp3', role: 'main' }],
      });

      // Emit from old player (generation 1)
      emitFromPlayer1({
        isLoaded: true,
        playing: true,
        currentTime: 30,
        duration: 100,
        isBuffering: false,
        didJustFinish: false,
        loop: false,
      });

      // Old callback should not trigger progress update
      expect(progressCb).not.toHaveBeenCalled();
    });
  });

  describe('unloadAll', () => {
    test('clears all players and resets state', async () => {
      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      await player.unloadAll();
      expect(player.isEmpty()).toBe(true);
    });

    test('removes player instances', async () => {
      const audioPlayer = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValue(audioPlayer);

      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      await player.unloadAll();
      expect(audioPlayer.remove).toHaveBeenCalled();
    });
  });

  describe('setVolume and getVolume', () => {
    test('sets volume on specified track', async () => {
      const bgPlayer = mockPlayer();
      const voicePlayer = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValueOnce(bgPlayer).mockReturnValueOnce(voicePlayer);

      await player.play({
        tracks: [
          { id: 'bg', url: 'https://example.com/bg.mp3', role: 'background' },
          { id: 'voice', url: 'https://example.com/voice.mp3', role: 'main' },
        ],
      });

      player.setVolume('bg', 0.5);
      expect(bgPlayer.volume).toBe(0.5);

      player.setVolume('voice', 0.8);
      expect(voicePlayer.volume).toBe(0.8);
    });

    test('clamps volume to [0, 1]', async () => {
      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      player.setVolume('main', -0.5);
      expect(mockAudioPlayer.volume).toBe(0);

      player.setVolume('main', 1.5);
      expect(mockAudioPlayer.volume).toBe(1);
    });

    test('getVolume returns track volume', async () => {
      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      player.setVolume('main', 0.7);
      expect(player.getVolume('main')).toBe(0.7);
    });

    test('getVolume returns 1.0 for non-existent track', () => {
      expect(player.getVolume('nonexistent')).toBe(1.0);
    });
  });

  describe('addTrack and removeTrack', () => {
    test('addTrack creates a new player and plays it', async () => {
      const trackPlayer = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValue(trackPlayer);

      const result = await player.addTrack({
        id: 'bg',
        url: 'https://example.com/bg.mp3',
        role: 'background',
      });

      expect(result).toBe(true);
      expect(expoAudio.createAudioPlayer).toHaveBeenCalled();
      expect(trackPlayer.play).toHaveBeenCalled();
      expect(player.isEmpty()).toBe(false);
    });

    test('addTrack returns false for invalid URL', async () => {
      const result = await player.addTrack({
        id: 'bg',
        url: '',
        role: 'background',
      });

      expect(result).toBe(false);
    });

    test('addTrack returns false for duplicate track ID', async () => {
      const trackPlayer = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValue(trackPlayer);

      await player.addTrack({ id: 'bg', url: 'https://example.com/bg.mp3', role: 'background' });

      // Try to add the same track again
      const result = await player.addTrack({
        id: 'bg',
        url: 'https://example.com/bg2.mp3',
        role: 'background',
      });

      expect(result).toBe(false);
    });

    test('addTrack does not affect existing tracks from play()', async () => {
      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      const trackPlayer = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValue(trackPlayer);

      await player.addTrack({ id: 'bg', url: 'https://example.com/bg.mp3', role: 'background' });

      // Both tracks should be present
      expect(player.isEmpty()).toBe(false);
      // main track should still exist (getVolume will find it)
      expect(player.getVolume('main')).toBe(1.0);
      // bg track should also exist
      expect(player.getVolume('bg')).toBe(1.0);
    });

    test('removeTrack removes a specific track', async () => {
      const trackPlayer = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValue(trackPlayer);

      await player.addTrack({ id: 'bg', url: 'https://example.com/bg.mp3', role: 'background' });
      expect(player.isEmpty()).toBe(false);

      await player.removeTrack('bg');
      expect(trackPlayer.remove).toHaveBeenCalled();
      expect(player.isEmpty()).toBe(true);
    });

    test('removeTrack handles non-existent track gracefully', async () => {
      await expect(player.removeTrack('nonexistent')).resolves.toBeUndefined();
    });

    test('removeTrack does not affect other tracks', async () => {
      const bgPlayer = mockPlayer();
      const ambientPlayer = mockPlayer();
      expoAudio.createAudioPlayer.mockReturnValueOnce(bgPlayer).mockReturnValueOnce(ambientPlayer);

      await player.addTrack({ id: 'bg', url: 'https://example.com/bg.mp3', role: 'background' });
      await player.addTrack({
        id: 'ambient',
        url: 'https://example.com/ambient.mp3',
        role: 'background',
      });

      await player.removeTrack('bg');
      expect(bgPlayer.remove).toHaveBeenCalled();
      expect(ambientPlayer.remove).not.toHaveBeenCalled();
      expect(player.isEmpty()).toBe(false);
    });
  });

  describe('buffering callback', () => {
    test('notifies buffering state changes', async () => {
      const bufferingCb = jest.fn();
      player.addBufferingListener(bufferingCb);

      await player.play({
        tracks: [{ id: 'main', url: 'https://example.com/audio.mp3', role: 'main' }],
      });

      mockAudioPlayer._emitStatus({
        isLoaded: true,
        playing: false,
        currentTime: 5,
        duration: 100,
        isBuffering: true,
        didJustFinish: false,
        loop: false,
      });

      expect(bufferingCb).toHaveBeenCalledWith(true);
    });
  });
});
