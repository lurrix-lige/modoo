import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/database', () => ({
  prisma: {
    subscription: {
      findMany: vi.fn(),
    },
    order: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../../services/SubscriptionService', () => ({
  expireSubscription: vi.fn(),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '../../utils/database';
import { expireSubscription } from '../SubscriptionService';
import { processExpiredSubscriptions, processExpiredOrders } from '../CronService';

const mockNow = new Date('2025-06-15T12:00:00Z');

describe('CronService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  describe('processExpiredSubscriptions', () => {
    it('should expire subscriptions past their period end', async () => {
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([
        { id: 'sub-1', userId: 'user-1', currentPeriodEnd: new Date('2025-06-01') },
        { id: 'sub-2', userId: 'user-2', currentPeriodEnd: new Date('2025-05-15') },
      ] as any);
      vi.mocked(expireSubscription).mockResolvedValue(undefined);

      await processExpiredSubscriptions();

      expect(prisma.subscription.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          currentPeriodEnd: { lt: mockNow },
        },
      });
      expect(expireSubscription).toHaveBeenCalledTimes(2);
      expect(expireSubscription).toHaveBeenCalledWith('sub-1');
      expect(expireSubscription).toHaveBeenCalledWith('sub-2');
    });

    it('should handle no expired subscriptions', async () => {
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([]);

      await processExpiredSubscriptions();

      expect(expireSubscription).not.toHaveBeenCalled();
    });

    it('should continue processing after individual failure', async () => {
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([
        { id: 'sub-1', userId: 'user-1', currentPeriodEnd: new Date('2025-06-01') },
        { id: 'sub-2', userId: 'user-2', currentPeriodEnd: new Date('2025-05-15') },
      ] as any);
      vi.mocked(expireSubscription)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(undefined);

      await processExpiredSubscriptions();

      expect(expireSubscription).toHaveBeenCalledTimes(2);
    });
  });

  describe('processExpiredOrders', () => {
    it('should expire pending orders older than 24 hours', async () => {
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 3 } as any);

      await processExpiredOrders();

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          createdAt: { lt: expect.any(Date) },
        },
        data: {
          status: 'EXPIRED',
          expiredAt: expect.any(Date),
        },
      });
    });

    it('should handle zero expired orders', async () => {
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 0 } as any);

      await processExpiredOrders();

      expect(prisma.order.updateMany).toHaveBeenCalled();
    });
  });
});
