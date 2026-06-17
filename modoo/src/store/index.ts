import { create } from 'zustand';
import {
  UserStatus,
  User,
  Child,
  UserState,
  INITIAL_USER_STATE,
  determineUserStatus,
} from '../types/userStatus';
import { Story } from '../types';
import { logger } from '../utils/logger';

interface PlayerError {
  message: string;
  code?: string;
  timestamp?: number;
}

interface PlayerState {
  isPlaying: boolean;
  currentStory: Story | null;
  currentTrackIndex: number;
  progress: number;
  duration: number;
  volume: number;
  isMiniPlayerVisible: boolean;
  error: PlayerError | null;
}

interface PendingNavigation {
  screen: string;
  params?: Record<string, any>;
}

interface AppState {
  // 后向兼容的字段
  isAuthenticated: boolean;
  user: User | null;
  child: Child | null;

  // 新的用户状态结构
  userState: UserState;
  isChildMode: boolean;
  isComfortMode: boolean;
  comfortModeVolume: number;
  themeMode: 'light' | 'dark' | 'system';
  
  // 待处理的导航
  pendingNavigation: PendingNavigation | null;

  setAuthenticated: (isAuth: boolean, user?: User) => void;
  setPaidStatus: (isPaid: boolean) => void;
  setChild: (child: Child) => void;
  updateVisitRecord: () => void;
  switchToChildMode: () => void;
  switchToParentMode: () => void;
  enterComfortMode: () => void;
  exitComfortMode: () => void;
  setComfortVolume: (volume: number) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  logout: () => void;
  
  // 导航相关方法
  setPendingNavigation: (navigation: PendingNavigation | null) => void;
  clearPendingNavigation: () => void;
}

interface PlayerActions {
  play: (story: Story) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (position: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
  updateProgress: (progress: number, duration: number) => void;
  setError: (message: string, code?: string) => void;
  clearError: () => void;
  toggleFavorite: () => Promise<void>;
  share: (platform?: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 后向兼容的字段
  isAuthenticated: false,
  user: null,
  child: null,

  // 新的用户状态结构
  userState: { ...INITIAL_USER_STATE },
  isChildMode: true,
  isComfortMode: false,
  comfortModeVolume: 30,
  themeMode: 'system',
  
  // 待处理的导航
  pendingNavigation: null,

  setAuthenticated: (isAuth, user) =>
    set((state) => {
      const newIsPaid = state.userState.isPaid;
      const newStatus = determineUserStatus(isAuth, newIsPaid);
      return {
        isAuthenticated: isAuth,
        user: isAuth && user ? user : null,
        userState: {
          ...state.userState,
          isAuthenticated: isAuth,
          user: isAuth && user ? user : undefined,
          status: newStatus,
        },
      };
    }),

  setPaidStatus: (isPaid) =>
    set((state) => {
      const newStatus = determineUserStatus(state.userState.isAuthenticated, isPaid);
      return {
        userState: {
          ...state.userState,
          isPaid,
          status: newStatus,
        },
      };
    }),

  setChild: (child) =>
    set((state) => ({
      child,
      userState: {
        ...state.userState,
        child,
      },
    })),

  updateVisitRecord: () =>
    set((state) => ({
      userState: {
        ...state.userState,
        lastVisitTime: new Date().toISOString(),
        visitCount: state.userState.visitCount + 1,
      },
    })),

  switchToChildMode: () => set({ isChildMode: true }),
  switchToParentMode: () => set({ isChildMode: false }),
  enterComfortMode: () => set({ isComfortMode: true, comfortModeVolume: 30 }),
  exitComfortMode: () => set({ isComfortMode: false }),
  setComfortVolume: (volume) => set({ comfortModeVolume: volume }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  logout: () =>
    set({
      isAuthenticated: false,
      user: null,
      child: null,
      userState: { ...INITIAL_USER_STATE },
  isChildMode: false,
      isComfortMode: false,
      pendingNavigation: null,
    }),
  
  setPendingNavigation: (navigation) => set({ pendingNavigation: navigation }),
  clearPendingNavigation: () => set({ pendingNavigation: null }),
}));

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  isPlaying: false,
  currentStory: null,
  currentTrackIndex: 0,
  progress: 0,
  duration: 0,
  volume: 1,
  isMiniPlayerVisible: false,
  error: null,

  play: (story) =>
    set({
      currentStory: story,
      isMiniPlayerVisible: true,
      progress: 0,
      error: null,
    }),

  pause: () => {
    // 实际的暂停通过 AudioProvider 处理
  },

  resume: () => {
    // 实际的恢复通过 AudioProvider 处理
  },

  stop: () =>
    set({
      currentStory: null,
      progress: 0,
      duration: 0,
      isMiniPlayerVisible: false,
      error: null,
    }),

  seekTo: (position) => {
    // 实际的跳转通过 AudioProvider 处理
  },

  setVolume: (volume) => set({ volume }),

  next: () =>
    set((state) => ({
      currentTrackIndex: state.currentTrackIndex + 1,
    })),

  previous: () =>
    set((state) => ({
      currentTrackIndex: Math.max(0, state.currentTrackIndex - 1),
    })),

  showMiniPlayer: () => set({ isMiniPlayerVisible: true }),

  hideMiniPlayer: () => set({ isMiniPlayerVisible: false }),

  updateProgress: (progress, duration) => set({ progress, duration }),

  setError: (message, code) =>
    set({
      error: {
        message,
        code,
        timestamp: Date.now(),
      },
    }),

  clearError: () => set({ error: null }),

  toggleFavorite: async () => {
    const { currentStory } = get();
    if (!currentStory) return;

    try {
      const { storyApi } = await import('../infrastructure/api');

      if (currentStory.isFavorite) {
        await storyApi.unfavoriteStory(currentStory.id);
        set((state) =>
          state.currentStory
            ? { ...state, currentStory: { ...state.currentStory, isFavorite: false } }
            : state,
        );
      } else {
        await storyApi.favoriteStory(currentStory.id);
        set((state) =>
          state.currentStory
            ? { ...state, currentStory: { ...state.currentStory, isFavorite: true } }
            : state,
        );
      }
    } catch (error) {
      logger.error('Failed to toggle favorite', { error });
    }
  },

  share: async (platform?: string) => {
    const { currentStory } = get();
    if (!currentStory) return;

    try {
      const { storyApi } = await import('../infrastructure/api');
      await storyApi.shareStory(currentStory.id, platform);
    } catch (error) {
      logger.error('Failed to share story', { error });
    }
  },
}));

export type { User, Child };
export { Story } from '../types';
