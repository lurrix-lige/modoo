import { FastifyInstance } from 'fastify';
import { authenticate, prisma } from '../utils/database';
import { customError } from '../utils/errors';

const defaultNotificationSettings = {
  sleepReminder: true,
  checkInReminder: true,
  reportNotification: true,
  expertReminder: false,
  activityReminder: true,
};

const defaultPrivacySettings = {
  dataCollection: true,
  analytics: true,
  personalizedRecommendations: true,
};

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/notifications', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).userId;
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      return {
        success: true,
        data: defaultNotificationSettings,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: {
        sleepReminder: settings.sleepReminder,
        checkInReminder: settings.checkInReminder,
        reportNotification: settings.reportNotification,
        expertReminder: settings.expertReminder,
        activityReminder: settings.activityReminder,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.put('/notifications', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).userId;
    const {
      sleepReminder,
      checkInReminder,
      reportNotification,
      expertReminder,
      activityReminder,
    } = request.body as any;

    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: {
        sleepReminder: sleepReminder ?? defaultNotificationSettings.sleepReminder,
        checkInReminder: checkInReminder ?? defaultNotificationSettings.checkInReminder,
        reportNotification: reportNotification ?? defaultNotificationSettings.reportNotification,
        expertReminder: expertReminder ?? defaultNotificationSettings.expertReminder,
        activityReminder: activityReminder ?? defaultNotificationSettings.activityReminder,
      },
      create: {
        userId,
        sleepReminder: sleepReminder ?? defaultNotificationSettings.sleepReminder,
        checkInReminder: checkInReminder ?? defaultNotificationSettings.checkInReminder,
        reportNotification: reportNotification ?? defaultNotificationSettings.reportNotification,
        expertReminder: expertReminder ?? defaultNotificationSettings.expertReminder,
        activityReminder: activityReminder ?? defaultNotificationSettings.activityReminder,
      },
    });

    return {
      success: true,
      data: {
        sleepReminder: settings.sleepReminder,
        checkInReminder: settings.checkInReminder,
        reportNotification: settings.reportNotification,
        expertReminder: settings.expertReminder,
        activityReminder: settings.activityReminder,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/privacy', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).userId;
    const settings = await prisma.privacySettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      return {
        success: true,
        data: defaultPrivacySettings,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: {
        dataCollection: settings.dataCollection,
        analytics: settings.analytics,
        personalizedRecommendations: settings.personalizedRecommendations,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.put('/privacy', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).userId;
    const {
      dataCollection,
      analytics,
      personalizedRecommendations,
    } = request.body as any;

    const settings = await prisma.privacySettings.upsert({
      where: { userId },
      update: {
        dataCollection: dataCollection ?? defaultPrivacySettings.dataCollection,
        analytics: analytics ?? defaultPrivacySettings.analytics,
        personalizedRecommendations: personalizedRecommendations ?? defaultPrivacySettings.personalizedRecommendations,
      },
      create: {
        userId,
        dataCollection: dataCollection ?? defaultPrivacySettings.dataCollection,
        analytics: analytics ?? defaultPrivacySettings.analytics,
        personalizedRecommendations: personalizedRecommendations ?? defaultPrivacySettings.personalizedRecommendations,
      },
    });

    return {
      success: true,
      data: {
        dataCollection: settings.dataCollection,
        analytics: settings.analytics,
        personalizedRecommendations: settings.personalizedRecommendations,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/export', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        child: true,
        checkIns: true,
      },
    });

    if (!user) {
      throw customError('USER_NOT_FOUND', '用户不存在', 404);
    }

    return {
      success: true,
      data: {
        success: true,
        downloadUrl: `https://api.dozoo.com/exports/${userId}-data.json`,
      },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.post('/delete', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = (request as any).userId;

    await prisma.$transaction([
      prisma.notificationSettings.deleteMany({ where: { userId } }),
      prisma.privacySettings.deleteMany({ where: { userId } }),
      prisma.child.deleteMany({ where: { userId } }),
      prisma.checkIn.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return {
      success: true,
      data: { success: true },
      timestamp: new Date().toISOString(),
    };
  });
}
