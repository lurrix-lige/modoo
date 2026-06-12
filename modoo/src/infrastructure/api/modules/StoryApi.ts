import { apiService, StoriesResponse, Story, StoryStatsResponse } from '../ApiService';

export const storyApi = {
  getStories: (): Promise<StoriesResponse> => apiService.getStories(),
  getStory: (storyId: string): Promise<Story> => apiService.getStory(storyId),
  favoriteStory: (storyId: string): Promise<{ success: boolean; isFavorite: boolean }> =>
    apiService.favoriteStory(storyId),
  unfavoriteStory: (storyId: string): Promise<{ success: boolean; isFavorite: boolean }> =>
    apiService.unfavoriteStory(storyId),
  shareStory: (storyId: string, platform?: string): Promise<{ success: boolean; shareId: string }> =>
    apiService.shareStory(storyId, platform),
  updateStoryProgress: (storyId: string, progress: number, completed: boolean): Promise<void> =>
    apiService.updateStoryProgress(storyId, progress, completed),
  getStoryStats: (): Promise<StoryStatsResponse> => apiService.getStoryStats(),
  getFavoriteStories: (): Promise<StoriesResponse> => apiService.getFavoriteStories(),
};
