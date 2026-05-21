import { FastifyInstance } from 'fastify';
import { prisma, authenticate, AuthenticatedRequest } from '../utils/database';
import { customError } from '../utils/errors';

async function verifyAdmin(request: AuthenticatedRequest): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: request.userId! },
  });
  
  if (!user || user?.role !== 'ADMIN') {
    throw customError('FORBIDDEN', '需要管理员权限', 403);
  }
}

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.post('/events', async (request, reply) => {
    const {
      eventName,
      eventType,
      userId,
      deviceId,
      sessionId,
      screenName,
      screenPath,
      screenParams,
      elementId,
      elementType,
      eventData,
      platform,
      deviceModel,
      osVersion,
      appVersion,
      timezone,
      locale,
      occurredAt,
      durationMs,
      success,
      errorType,
      isAnonymous = false,
    } = request.body as {
      eventName: string;
      eventType: string;
      userId?: string;
      deviceId: string;
      sessionId?: string;
      screenName?: string;
      screenPath?: string;
      screenParams?: string;
      elementId?: string;
      elementType?: string;
      eventData?: string;
      platform?: string;
      deviceModel?: string;
      osVersion?: string;
      appVersion?: string;
      timezone?: string;
      locale?: string;
      occurredAt?: string;
      durationMs?: number;
      success?: boolean;
      errorType?: string;
      isAnonymous?: boolean;
    };

    const event = await prisma.analyticsEvent.create({
      data: {
        eventName,
        eventType,
        userId: isAnonymous ? null : userId,
        deviceId,
        sessionId,
        screenName,
        screenPath,
        screenParams,
        elementId,
        elementType,
        eventData,
        platform,
        deviceModel,
        osVersion,
        appVersion,
        timezone,
        locale,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        durationMs,
        success,
        errorType,
        isAnonymous,
      },
    });

    reply.status(201);
    return {
      success: true,
      data: { eventId: event.id },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/events/batch', async (request, reply) => {
    const { batchId, deviceId, events } = request.body as {
      batchId: string;
      deviceId: string;
      events: Array<{
        eventName: string;
        eventType: string;
        userId?: string;
        sessionId?: string;
        screenName?: string;
        screenPath?: string;
        screenParams?: string;
        elementId?: string;
        elementType?: string;
        eventData?: string;
        platform?: string;
        deviceModel?: string;
        osVersion?: string;
        appVersion?: string;
        timezone?: string;
        locale?: string;
        occurredAt?: string;
        durationMs?: number;
        success?: boolean;
        errorType?: string;
        isAnonymous?: boolean;
      }>;
    };

    const existingBatch = await prisma.analyticsBatch.findUnique({
      where: { batchId },
    });

    if (existingBatch) {
      throw customError('CONFLICT', '批次ID已存在', 409);
    }

    if (events.length === 0) {
      throw customError('VALIDATION_ERROR', '事件列表不能为空', 400);
    }

    const firstEventTime = new Date(events[0].occurredAt || Date.now());
    const lastEventTime = new Date(events[events.length - 1].occurredAt || Date.now());

    const batch = await prisma.analyticsBatch.create({
      data: {
        batchId,
        deviceId,
        eventCount: events.length,
        status: 'PENDING',
        firstEventAt: firstEventTime,
        lastEventAt: lastEventTime,
      },
    });

    const eventData = events.map((event) => ({
      ...event,
      occurredAt: event.occurredAt ? new Date(event.occurredAt) : new Date(),
      batchId: batch.id,
    }));

    await prisma.analyticsEvent.createMany({
      data: eventData as any,
    });

    await prisma.analyticsBatch.update({
      where: { id: batch.id },
      data: { status: 'PROCESSED', sentAt: new Date() },
    });

    reply.status(201);
    return {
      success: true,
      data: { batchId: batch.batchId, eventsProcessed: events.length },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/sessions', async (request, reply) => {
    const { userId, deviceId, startTime, endTime, durationMs, screensVisited } = request.body as {
      userId?: string;
      deviceId: string;
      startTime: string;
      endTime?: string;
      durationMs?: number;
      screensVisited?: string;
    };

    const session = await prisma.analyticsSession.create({
      data: {
        userId,
        deviceId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        durationMs,
        screensVisited,
      },
    });

    reply.status(201);
    return {
      success: true,
      data: { sessionId: session.id },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/profile', async (request, reply) => {
    const { userId, deviceId, lastVisitAt, totalVisits, totalSessions, totalTimeMs, preferredLanguage, preferredTheme, signupStep, onboardingComplete, featuresUsed } = request.body as {
      userId: string;
      deviceId?: string;
      lastVisitAt?: string;
      totalVisits?: number;
      totalSessions?: number;
      totalTimeMs?: number;
      preferredLanguage?: string;
      preferredTheme?: string;
      signupStep?: number;
      onboardingComplete?: boolean;
      featuresUsed?: string;
    };

    const profile = await prisma.analyticsUserProfile.upsert({
      where: { userId },
      update: {
        ...(deviceId && { deviceId }),
        ...(lastVisitAt && { lastVisitAt: new Date(lastVisitAt) }),
        ...(totalVisits !== undefined && { totalVisits }),
        ...(totalSessions !== undefined && { totalSessions }),
        ...(totalTimeMs !== undefined && { totalTimeMs }),
        ...(preferredLanguage && { preferredLanguage }),
        ...(preferredTheme && { preferredTheme }),
        ...(signupStep !== undefined && { signupStep }),
        ...(onboardingComplete !== undefined && { onboardingComplete }),
        ...(featuresUsed && { featuresUsed }),
        updatedAt: new Date(),
      },
      create: {
        userId,
        deviceId,
        lastVisitAt: lastVisitAt ? new Date(lastVisitAt) : new Date(),
        totalVisits: totalVisits || 1,
        totalSessions: totalSessions || 1,
        totalTimeMs: totalTimeMs || 0,
        preferredLanguage,
        preferredTheme,
        signupStep: signupStep || 0,
        onboardingComplete: onboardingComplete || false,
        featuresUsed,
      },
    });

    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/feature-usage', async (request, reply) => {
    const { userId, featureKey, count = 1, lastUsedAt, totalDurationMs = 0 } = request.body as {
      userId: string;
      featureKey: string;
      count?: number;
      lastUsedAt?: string;
      totalDurationMs?: number;
    };

    const usage = await prisma.analyticsFeatureUsage.upsert({
      where: { userId_featureKey: { userId, featureKey } },
      update: {
        count: { increment: count },
        lastUsedAt: lastUsedAt ? new Date(lastUsedAt) : new Date(),
        totalDurationMs: { increment: totalDurationMs },
      },
      create: {
        userId,
        featureKey,
        count,
        lastUsedAt: lastUsedAt ? new Date(lastUsedAt) : new Date(),
        totalDurationMs,
      },
    });

    return {
      success: true,
      data: usage,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/errors', async (request, reply) => {
    const { errorType, message, stackTrace, userId, deviceId, screenName, occurredAt } = request.body as {
      errorType: string;
      message: string;
      stackTrace?: string;
      userId?: string;
      deviceId?: string;
      screenName?: string;
      occurredAt?: string;
    };

    const error = await prisma.analyticsError.create({
      data: {
        errorType,
        message,
        stackTrace,
        userId,
        deviceId,
        screenName,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      },
    });

    reply.status(201);
    return {
      success: true,
      data: { errorId: error.id },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/events', { preHandler: [authenticate] }, async (request, reply) => {
    await verifyAdmin(request as AuthenticatedRequest);
    
    const { page = 1, limit = 50, eventName, eventType, userId, deviceId, startDate, endDate } = request.query as {
      page?: number;
      limit?: number;
      eventName?: string;
      eventType?: string;
      userId?: string;
      deviceId?: string;
      startDate?: string;
      endDate?: string;
    };

    const skip = (page - 1) * limit;
    const where: any = {};

    if (eventName) where.eventName = eventName;
    if (eventType) where.eventType = eventType;
    if (userId) where.userId = userId;
    if (deviceId) where.deviceId = deviceId;
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.analyticsEvent.count({ where }),
    ]);

    return {
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/events/stats', { preHandler: [authenticate] }, async (request, reply) => {
    await verifyAdmin(request as AuthenticatedRequest);
    
    const { startDate, endDate } = request.query as {
      startDate?: string;
      endDate?: string;
    };

    const where: any = {};
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    const [totalEvents, users, devices, eventTypeStats] = await Promise.all([
      prisma.analyticsEvent.count({ where }),
      prisma.analyticsEvent.findMany({ where, select: { userId: true }, distinct: ['userId'] }),
      prisma.analyticsEvent.findMany({ where, select: { deviceId: true }, distinct: ['deviceId'] }),
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        _count: { eventType: true },
        where,
        orderBy: { _count: { eventType: 'desc' } },
      }),
    ]);
    
    const uniqueUsers = users.length;
    const uniqueDevices = devices.length;

    return {
      success: true,
      data: {
        totalEvents,
        uniqueUsers,
        uniqueDevices,
        eventTypeStats: eventTypeStats.map((stat: { eventType: string; _count: { eventType: number } }) => ({
          eventType: stat.eventType,
          count: stat._count.eventType,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/errors', { preHandler: [authenticate] }, async (request, reply) => {
    await verifyAdmin(request as AuthenticatedRequest);
    
    const { page = 1, limit = 50, errorType, userId, startDate, endDate } = request.query as {
      page?: number;
      limit?: number;
      errorType?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    };

    const skip = (page - 1) * limit;
    const where: any = {};

    if (errorType) where.errorType = errorType;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    const [errors, total] = await Promise.all([
      prisma.analyticsError.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),
      prisma.analyticsError.count({ where }),
    ]);

    return {
      success: true,
      data: {
        errors,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/profile/:userId', { preHandler: [authenticate] }, async (request, reply) => {
    await verifyAdmin(request as AuthenticatedRequest);
    
    const { userId } = request.params as { userId: string };

    const profile = await prisma.analyticsUserProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw customError('NOT_FOUND', '用户画像不存在', 404);
    }

    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/feature-usage', { preHandler: [authenticate] }, async (request, reply) => {
    await verifyAdmin(request as AuthenticatedRequest);
    
    const { userId, featureKey, page = 1, limit = 50 } = request.query as {
      userId?: string;
      featureKey?: string;
      page?: number;
      limit?: number;
    };

    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) where.userId = userId;
    if (featureKey) where.featureKey = featureKey;

    const [usage, total] = await Promise.all([
      prisma.analyticsFeatureUsage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { count: 'desc' },
      }),
      prisma.analyticsFeatureUsage.count({ where }),
    ]);

    return {
      success: true,
      data: {
        usage,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/overview', { preHandler: [authenticate] }, async (request, reply) => {
    await verifyAdmin(request as AuthenticatedRequest);
    
    const { period = 'week' } = request.query as { period?: 'day' | 'week' | 'month' };

    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const where = {
      occurredAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [
      totalEvents,
      users,
      activeUsers,
      totalErrors,
      featureUsage,
      dailyStats,
    ] = await Promise.all([
      prisma.analyticsEvent.count({ where }),
      prisma.analyticsEvent.findMany({ where, select: { userId: true }, distinct: ['userId'] }),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.analyticsError.count({ where: { occurredAt: { gte: startDate, lte: endDate } } }),
      prisma.analyticsFeatureUsage.aggregate({
        _sum: { count: true },
        _avg: { totalDurationMs: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['occurredAt'],
        _count: { occurredAt: true },
        where,
        orderBy: { occurredAt: 'asc' },
      }),
    ]);
    
    const uniqueUsers = users.length;

    return {
      success: true,
      data: {
        period,
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        metrics: {
          totalEvents,
          uniqueUsers,
          activeUsers,
          totalErrors,
          avgDailyEvents: Math.round(totalEvents / (period === 'day' ? 1 : period === 'week' ? 7 : 30)),
          avgSessionDuration: featureUsage._avg?.totalDurationMs ? Math.round((featureUsage._avg.totalDurationMs / 1000) / 60) : 0,
        },
        dailyStats: dailyStats.map((stat: { occurredAt: Date; _count: { occurredAt: number } }) => ({
          date: stat.occurredAt.toISOString().split('T')[0],
          count: stat._count.occurredAt,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  });
}