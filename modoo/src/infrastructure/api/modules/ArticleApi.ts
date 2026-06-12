import { apiService, ArticlesResponse, Article } from '../ApiService';

export const articleApi = {
  getArticles: (): Promise<ArticlesResponse> => apiService.getArticles(),
  getArticle: (articleId: string): Promise<Article> => apiService.getArticle(articleId),
  favoriteArticle: (articleId: string): Promise<{ success: boolean; isFavorite: boolean }> =>
    apiService.favoriteArticle(articleId),
  unfavoriteArticle: (articleId: string): Promise<{ success: boolean; isFavorite: boolean }> =>
    apiService.unfavoriteArticle(articleId),
  shareArticle: (articleId: string, platform?: string): Promise<{ success: boolean; shareId: string }> =>
    apiService.shareArticle(articleId, platform),
  getFavoriteArticles: (): Promise<ArticlesResponse> => apiService.getFavoriteArticles(),
};
