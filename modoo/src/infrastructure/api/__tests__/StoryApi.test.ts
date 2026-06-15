import { storyApi } from '../modules/StoryApi';

jest.mock('../ApiService', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const { apiService } = require('../ApiService');

describe('StoryApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStories', () => {
    it('should call apiService.get with /stories', async () => {
      const mockResponse = { stories: [], total: 0 };
      apiService.get.mockResolvedValue(mockResponse);

      const result = await storyApi.getStories();
      expect(result).toEqual(mockResponse);
      expect(apiService.get).toHaveBeenCalledWith('/stories');
    });
  });

  describe('getStory', () => {
    it('should call apiService.get with story id', async () => {
      const mockStory = { id: '123', title: 'Test Story' };
      apiService.get.mockResolvedValue(mockStory);

      const result = await storyApi.getStory('123');
      expect(result).toEqual(mockStory);
      expect(apiService.get).toHaveBeenCalledWith('/stories/123');
    });
  });

  describe('favoriteStory', () => {
    it('should call apiService.post with favorite endpoint', async () => {
      const mockResponse = { success: true, isFavorite: true };
      apiService.post.mockResolvedValue(mockResponse);

      const result = await storyApi.favoriteStory('123');
      expect(result).toEqual(mockResponse);
      expect(apiService.post).toHaveBeenCalledWith('/stories/123/favorite', {});
    });
  });

  describe('updateStoryProgress', () => {
    it('should call apiService.post with progress data', async () => {
      apiService.post.mockResolvedValue(undefined);

      await storyApi.updateStoryProgress('123', 0.5, false);
      expect(apiService.post).toHaveBeenCalledWith('/stories/123/progress', { progress: 0.5, completed: false });
    });
  });
});
