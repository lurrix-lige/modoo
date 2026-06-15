import { apiService } from '../ApiService';
import type { ContentRecommendationsResponse, GuardianSpiritsResponse, GuardianSpirit, PromotionsResponse, Promotion } from '../types';

export const contentApi = {
  getContentRecommendations: () => apiService.get<ContentRecommendationsResponse>('/content/recommendations'),
  getGuardianSpirits: () => apiService.get<GuardianSpiritsResponse>('/guardian-spirits'),
  getGuardianSpirit: (spiritId: string) => apiService.get<GuardianSpirit>(`/guardian-spirits/${spiritId}`),
  getDefaultGuardianSpirit: () => apiService.get<GuardianSpirit>('/guardian-spirits/default'),
  getPromotions: (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    type?: string;
    code?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.code) queryParams.append('code', params.code);
    const query = queryParams.toString();
    return apiService.get<PromotionsResponse>(`/promotions${query ? `?${query}` : ''}`);
  },
  getPromotion: (promotionId: string) => apiService.get<Promotion>(`/promotions/${promotionId}`),
  getPromotionByCode: (code: string) => apiService.get<Promotion>(`/promotions/code/${code}`),
};
