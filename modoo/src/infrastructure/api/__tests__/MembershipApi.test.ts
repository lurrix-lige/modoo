import { membershipApi } from '../modules/MembershipApi';

jest.mock('../ApiService', () => ({
  apiService: {
    getMembershipPlans: jest.fn(),
    getMembershipPlan: jest.fn(),
    getCurrentMembership: jest.fn(),
    subscribe: jest.fn(),
    cancelMembership: jest.fn(),
    getMembershipStatus: jest.fn(),
    checkAccess: jest.fn(),
    createOrder: jest.fn(),
    getOrders: jest.fn(),
    getOrderDetail: jest.fn(),
    getOrderByNo: jest.fn(),
    payOrder: jest.fn(),
    cancelOrder: jest.fn(),
    getTransactions: jest.fn(),
    getSubscriptions: jest.fn(),
    updateSubscription: jest.fn(),
    getBenefits: jest.fn(),
    getBenefit: jest.fn(),
    getBenefitByKey: jest.fn(),
    getBenefitsByProduct: jest.fn(),
  },
}));

describe('MembershipApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMembershipPlans', () => {
    it('should return membership plans', async () => {
      const mockPlans = [
        { id: '1', name: 'Basic', price: 9.99 },
        { id: '2', name: 'Premium', price: 19.99 },
      ];
      require('../ApiService').apiService.getMembershipPlans.mockResolvedValue(mockPlans);

      const result = await membershipApi.getMembershipPlans();
      expect(result).toEqual(mockPlans);
    });
  });

  describe('subscribe', () => {
    it('should call apiService.subscribe with planId', async () => {
      require('../ApiService').apiService.subscribe.mockResolvedValue(undefined);

      await membershipApi.subscribe('plan-123');
      expect(require('../ApiService').apiService.subscribe).toHaveBeenCalledWith('plan-123', undefined);
    });
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const mockOrder = { id: 'order-123', status: 'pending' };
      require('../ApiService').apiService.createOrder.mockResolvedValue(mockOrder);

      const result = await membershipApi.createOrder({ planId: 'plan-123' });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('checkAccess', () => {
    it('should check access with contentId and contentType', async () => {
      const mockAccess = { hasAccess: true };
      require('../ApiService').apiService.checkAccess.mockResolvedValue(mockAccess);

      const result = await membershipApi.checkAccess('content-123', 'story');
      expect(result).toEqual(mockAccess);
      expect(require('../ApiService').apiService.checkAccess).toHaveBeenCalledWith('content-123', 'story');
    });
  });
});
