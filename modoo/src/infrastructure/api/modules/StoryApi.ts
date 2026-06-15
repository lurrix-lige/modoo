import { apiService } from '../ApiService';
import type { StoriesResponse, Story, StoryStatsResponse } from '../types';

export const storyApi = {
  getStories: () => apiService.get<StoriesResponse>('/stories'),
  getStory: (storyId: string) => apiService.get<Story>(`/stories/${storyId}`),
  favoriteStory: (storyId: string) =>
    apiService.post<{ success: boolean; isFavorite: boolean }>(`/stories/${storyId}/favorite`, {}),
  unfavoriteStory: (storyId: string) =>
    apiService.delete<{ success: boolean; isFavorite: boolean }>(`/stories/${storyId}/favorite`),
  shareStory: (storyId: string, platform?: string) =>
    apiService.post<{ success: boolean; shareId: string }>(
      `/stories/${storyId}/share`,
      platform ? { platform } : {},
    ),
  updateStoryProgress: (storyId: string, progress: number, completed: boolean) =>
    apiService.post<void>(`/stories/${storyId}/progress`, { progress, completed }),
  getStoryStats: () => apiService.get<StoryStatsResponse>('/stories/stats/summary'),
  getFavoriteStories: () => apiService.get<StoriesResponse>('/stories/favorites', true),
};
