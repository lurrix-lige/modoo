import { apiService, MembershipPlan, CurrentMembership, MembershipStatusResponse, AccessCheckResponse, CreateOrderRequest, Order, OrdersResponse, PaymentResponse, CancelOrderResponse, TransactionsResponse, SubscriptionsResponse, Subscription, UpdateSubscriptionRequest, BenefitsResponse, Benefit, MembershipPlanList } from '../ApiService';

export const membershipApi = {
  getMembershipPlans: (): Promise<MembershipPlan[]> => apiService.getMembershipPlans(),
  getMembershipPlan: (planId: string): Promise<MembershipPlan> => apiService.getMembershipPlan(planId),
  getCurrentMembership: (): Promise<CurrentMembership> => apiService.getCurrentMembership(),
  subscribe: (planId: string, suppressError?: boolean): Promise<void> =>
    apiService.subscribe(planId, suppressError),
  cancelMembership: (): Promise<void> => apiService.cancelMembership(),
  getMembershipStatus: (): Promise<MembershipStatusResponse> => apiService.getMembershipStatus(),
  checkAccess: (contentId?: string, contentType?: string): Promise<AccessCheckResponse> =>
    apiService.checkAccess(contentId, contentType),
  createOrder: (data: CreateOrderRequest): Promise<Order> => apiService.createOrder(data),
  getOrders: (): Promise<OrdersResponse> => apiService.getOrders(),
  getOrderDetail: (orderId: string): Promise<Order> => apiService.getOrderDetail(orderId),
  getOrderByNo: (orderNo: string): Promise<Order> => apiService.getOrderByNo(orderNo),
  payOrder: (orderId: string, paymentMethod?: string): Promise<PaymentResponse> =>
    apiService.payOrder(orderId, paymentMethod),
  cancelOrder: (orderId: string): Promise<CancelOrderResponse> => apiService.cancelOrder(orderId),
  getTransactions: (): Promise<TransactionsResponse> => apiService.getTransactions(),
  getSubscriptions: (): Promise<SubscriptionsResponse> => apiService.getSubscriptions(),
  updateSubscription: (subscriptionId: string, data: UpdateSubscriptionRequest): Promise<Subscription> =>
    apiService.updateSubscription(subscriptionId, data),
  getBenefits: (): Promise<BenefitsResponse> => apiService.getBenefits(),
  getBenefit: (benefitId: string): Promise<Benefit> => apiService.getBenefit(benefitId),
  getBenefitByKey: (benefitKey: string): Promise<Benefit> => apiService.getBenefitByKey(benefitKey),
  getBenefitsByProduct: (productType: string): Promise<BenefitsResponse> =>
    apiService.getBenefitsByProduct(productType),
};
