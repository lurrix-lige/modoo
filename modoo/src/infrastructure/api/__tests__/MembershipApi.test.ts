import { membershipApi } from '../modules/MembershipApi';

jest.mock('../ApiService', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const { apiService } = require('../ApiService');

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
      apiService.get.mockResolvedValue(mockPlans);

      const result = await membershipApi.getMembershipPlans();
      expect(result).toEqual(mockPlans);
    });

    it('should return empty array on error', async () => {
      apiService.get.mockRejectedValue(new Error('Network error'));

      const result = await membershipApi.getMembershipPlans();
      expect(result).toEqual([]);
    });
  });

  describe('subscribe', () => {
    it('should call apiService.post with planId', async () => {
      apiService.post.mockResolvedValue(undefined);

      await membershipApi.subscribe('plan-123');
      expect(apiService.post).toHaveBeenCalledWith('/membership/subscribe', { planId: 'plan-123' }, undefined);
    });
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const mockOrder = { id: 'order-123', status: 'pending' };
      apiService.post.mockResolvedValue(mockOrder);

      const result = await membershipApi.createOrder({ planId: 'plan-123' });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('checkAccess', () => {
    it('should check access with contentId and contentType', async () => {
      const mockAccess = { hasAccess: true };
      apiService.get.mockResolvedValue(mockAccess);

      const result = await membershipApi.checkAccess('content-123', 'story');
      expect(result).toEqual(mockAccess);
      expect(apiService.get).toHaveBeenCalledWith('/membership/access/check?contentId=content-123&contentType=story');
    });
  });
});
