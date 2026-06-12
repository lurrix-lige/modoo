import { storyApi } from '../modules/StoryApi';

jest.mock('../ApiService', () => ({
  apiService: {
    getStories: jest.fn(),
    getStory: jest.fn(),
    favoriteStory: jest.fn(),
    unfavoriteStory: jest.fn(),
    shareStory: jest.fn(),
    updateStoryProgress: jest.fn(),
    getStoryStats: jest.fn(),
    getFavoriteStories: jest.fn(),
  },
}));

describe('StoryApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStories', () => {
    it('should call apiService.getStories', async () => {
      const mockResponse = { stories: [], total: 0 };
      require('../ApiService').apiService.getStories.mockResolvedValue(mockResponse);

      const result = await storyApi.getStories();
      expect(result).toEqual(mockResponse);
      expect(require('../ApiService').apiService.getStories).toHaveBeenCalled();
    });
  });

  describe('getStory', () => {
    it('should call apiService.getStory with storyId', async () => {
      const mockStory = { id: '123', title: 'Test Story' };
      require('../ApiService').apiService.getStory.mockResolvedValue(mockStory);

      const result = await storyApi.getStory('123');
      expect(result).toEqual(mockStory);
      expect(require('../ApiService').apiService.getStory).toHaveBeenCalledWith('123');
    });
  });

  describe('favoriteStory', () => {
    it('should call apiService.favoriteStory with storyId', async () => {
      const mockResponse = { success: true, isFavorite: true };
      require('../ApiService').apiService.favoriteStory.mockResolvedValue(mockResponse);

      const result = await storyApi.favoriteStory('123');
      expect(result).toEqual(mockResponse);
      expect(require('../ApiService').apiService.favoriteStory).toHaveBeenCalledWith('123');
    });
  });

  describe('updateStoryProgress', () => {
    it('should call apiService.updateStoryProgress with correct params', async () => {
      require('../ApiService').apiService.updateStoryProgress.mockResolvedValue(undefined);

      await storyApi.updateStoryProgress('123', 0.5, false);
      expect(require('../ApiService').apiService.updateStoryProgress).toHaveBeenCalledWith('123', 0.5, false);
    });
  });
});
