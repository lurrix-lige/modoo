import { apiService } from '../ApiService';
import { logger } from '../../../utils/logger';
import type {
  MembershipPlan,
  MembershipPlanList,
  CurrentMembership,
  MembershipStatusResponse,
  AccessCheckResponse,
  CreateOrderRequest,
  Order,
  OrdersResponse,
  PaymentResponse,
  CancelOrderResponse,
  TransactionsResponse,
  SubscriptionsResponse,
  Subscription,
  UpdateSubscriptionRequest,
  BenefitsResponse,
  Benefit,
} from '../types';

export const membershipApi = {
  getMembershipPlans: async (): Promise<MembershipPlan[]> => {
    try {
      const response = await apiService.get<MembershipPlanList>('/membership/plans');
      if (!response) return [];
      if (Array.isArray(response)) return response;
      return response.plans || [];
    } catch (error) {
      logger.error('Failed to load membership plans, returning empty array', { error });
      return [];
    }
  },
  getMembershipPlan: (planId: string) => apiService.get<MembershipPlan>(`/membership/plans/${planId}`),
  getCurrentMembership: () => apiService.get<CurrentMembership>('/membership/current'),
  subscribe: (planId: string, suppressError?: boolean) =>
    apiService.post<void>('/membership/subscribe', { planId }, suppressError),
  cancelMembership: () => apiService.post<void>('/membership/cancel'),
  getMembershipStatus: () => apiService.get<MembershipStatusResponse>('/membership/status'),
  checkAccess: (contentId?: string, contentType?: string) => {
    const params = new URLSearchParams();
    if (contentId) params.append('contentId', contentId);
    if (contentType) params.append('contentType', contentType);
    const query = params.toString();
    return apiService.get<AccessCheckResponse>(`/membership/access/check${query ? `?${query}` : ''}`);
  },
  createOrder: (data: CreateOrderRequest) => apiService.post<Order>('/membership/orders', data),
  getOrders: () => apiService.get<OrdersResponse>('/membership/orders'),
  getOrderDetail: (orderId: string) => apiService.get<Order>(`/membership/orders/${orderId}`),
  getOrderByNo: (orderNo: string) => apiService.get<Order>(`/membership/orders/orderNo/${orderNo}`),
  payOrder: (orderId: string, paymentMethod?: string) =>
    apiService.post<PaymentResponse>(`/membership/orders/${orderId}/pay`, {
      paymentMethod: paymentMethod || 'wechat',
    }),
  cancelOrder: (orderId: string) =>
    apiService.post<CancelOrderResponse>(`/membership/orders/${orderId}/cancel`, {}),
  getTransactions: () => apiService.get<TransactionsResponse>('/membership/transactions'),
  getSubscriptions: () => apiService.get<SubscriptionsResponse>('/membership/subscriptions'),
  updateSubscription: (subscriptionId: string, data: UpdateSubscriptionRequest) =>
    apiService.put<Subscription>(`/membership/subscriptions/${subscriptionId}`, data),
  getBenefits: () => apiService.get<BenefitsResponse>('/membership/benefits'),
  getBenefit: (benefitId: string) => apiService.get<Benefit>(`/membership/benefits/${benefitId}`),
  getBenefitByKey: (benefitKey: string) =>
    apiService.get<Benefit>(`/membership/benefits/key/${benefitKey}`),
  getBenefitsByProduct: (productType: string) =>
    apiService.get<BenefitsResponse>(`/membership/benefits/product/${productType}`),
};
