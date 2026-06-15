import { apiService } from '../ApiService';
import type { ArticlesResponse, Article } from '../types';

const cleanId = (id: string) => id.replace(/^\/|\/$/g, '');

export const articleApi = {
  getArticles: () => apiService.get<ArticlesResponse>('/articles'),
  getArticle: (articleId: string) => apiService.get<Article>(`/articles/${cleanId(articleId)}`),
  favoriteArticle: (articleId: string) =>
    apiService.post<{ success: boolean; isFavorite: boolean }>(
      `/articles/${cleanId(articleId)}/favorite`,
      {},
    ),
  unfavoriteArticle: (articleId: string) =>
    apiService.delete<{ success: boolean; isFavorite: boolean }>(
      `/articles/${cleanId(articleId)}/favorite`,
    ),
  shareArticle: (articleId: string, platform?: string) =>
    apiService.post<{ success: boolean; shareId: string }>(
      `/articles/${cleanId(articleId)}/share`,
      platform ? { platform } : {},
    ),
  getFavoriteArticles: () => apiService.get<ArticlesResponse>('/articles/favorites', true),
};
