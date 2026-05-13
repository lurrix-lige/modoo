import { FastifyInstance } from 'fastify';
import { prisma, optionalAuth, AuthenticatedRequest, getChildId } from '../utils/database';
import { customError } from '../utils/errors';

export async function checkInRoutes(fastify: FastifyInstance) {
  fastify.post('/', { preHandler: [optionalAuth] }, async (request, reply) => {
    const { date, sleepTime, wakeTime, quality } = request.body as {
      date?: string;
      sleepTime: string;
      wakeTime: string;
      quality: number;
    };

    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    const checkInDate = date || new Date().toISOString().split('T')[0];

    if (!anonymousId && !userId) {
      throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
    }

    let checkIn: any;
    
    if (userId && childId) {
      const existing = await prisma.checkIn.findUnique({
        where: { childId_date: { childId, date: checkInDate } },
      });

      checkIn = await prisma.checkIn.upsert({
        where: { childId_date: { childId, date: checkInDate } },
        update: { sleepTime, wakeTime, quality },
        create: {
          userId,
          childId,
          date: checkInDate,
          sleepTime,
          wakeTime,
          quality,
        },
      });
    } else if (anonymousId) {
      const existing = await prisma.checkIn.findFirst({
        where: { anonymousId, date: checkInDate },
      });

      if (existing) {
        checkIn = await prisma.checkIn.update({
          where: { id: existing.id },
          data: { sleepTime, wakeTime, quality },
        });
      } else {
        checkIn = await prisma.checkIn.create({
          data: {
            anonymousId,
            date: checkInDate,
            sleepTime,
            wakeTime,
            quality,
          },
        });
      }
    } else {
      throw customError('BAD_REQUEST', '需要用户信息或匿名ID', 400);
    }

    return {
      success: true,
      data: checkIn,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/streak', { preHandler: [optionalAuth] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    if (!anonymousId && !userId) {
      return {
        success: true,
        data: { streak: 0, longestStreak: 0, totalDays: 0 },
        timestamp: new Date().toISOString(),
      };
    }

    let checkIns: any[] = [];
    if (userId && childId) {
      checkIns = await prisma.checkIn.findMany({
        where: { childId },
        orderBy: { date: 'desc' },
      });
    } else if (anonymousId) {
      checkIns = await prisma.checkIn.findMany({
        where: { anonymousId },
        orderBy: { date: 'desc' },
      });
    } else {
      return {
        success: true,
        data: { streak: 0, longestStreak: 0, totalDays: 0 },
        timestamp: new Date().toISOString(),
      };
    }

    if (checkIns.length === 0) {
      return {
        success: true,
        data: { streak: 0, longestStreak: 0, totalDays: 0 },
        timestamp: new Date().toISOString(),
      };
    }

    let streak = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    for (const checkIn of checkIns) {
      const diff = Math.floor(
        (checkDate.getTime() - new Date(checkIn.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff <= 1) {
        currentStreak++;
        checkDate = new Date(checkIn.date);
      } else {
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        currentStreak = 1;
        checkDate = new Date(checkIn.date);
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    const sortedCheckIns = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
    let maxStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedCheckIns.length; i++) {
      const diff = Math.floor(
        (new Date(sortedCheckIns[i].date).getTime() - new Date(sortedCheckIns[i - 1].date).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diff === 1) {
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    streak = sortedCheckIns[0].date === today || sortedCheckIns[0].date === getYesterday() ? maxStreak : 0;

    return {
      success: true,
      data: { streak, longestStreak: maxStreak, totalDays: checkIns.length },
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/today', { preHandler: [optionalAuth] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);

    const now = new Date();
    const hour = now.getHours();
    let checkInDate = now.toISOString().split('T')[0];
    if (hour >= 0 && hour < 6) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      checkInDate = yesterday.toISOString().split('T')[0];
    }

    let checkIn = null;
    if (userId && childId) {
      checkIn = await prisma.checkIn.findUnique({
        where: { childId_date: { childId, date: checkInDate } },
      });
    } else if (anonymousId) {
      checkIn = await prisma.checkIn.findFirst({
        where: { anonymousId, date: checkInDate },
      });
    }

    return {
      success: true,
      data: checkIn,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/history', { preHandler: [optionalAuth] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);
    const { month } = request.query as { month?: string };

    let checkIns: any[] = [];
    
    if (userId && childId) {
      const where: any = { childId };
      if (month) {
        const [year, m] = month.split('-');
        const startDate = `${year}-${m}-01`;
        const endDate = `${year}-${m}-31`;
        where.date = { gte: startDate, lte: endDate };
      }

      checkIns = await prisma.checkIn.findMany({
        where,
        orderBy: { date: 'desc' },
      });
    } else if (anonymousId) {
      const where: any = { anonymousId };
      if (month) {
        const [year, m] = month.split('-');
        const startDate = `${year}-${m}-01`;
        const endDate = `${year}-${m}-31`;
        where.date = { gte: startDate, lte: endDate };
      }

      checkIns = await prisma.checkIn.findMany({
        where,
        orderBy: { date: 'desc' },
      });
    }

    return {
      success: true,
      data: checkIns,
      timestamp: new Date().toISOString(),
    };
  });

  fastify.get('/stats', { preHandler: [optionalAuth] }, async (request, reply) => {
    const userId = (request as AuthenticatedRequest).userId;
    const anonymousId = (request as AuthenticatedRequest).anonymousId;
    const childId = await getChildId(request);
    const { period = 'week' } = request.query as { period?: 'week' | 'month' };

    if (!childId && !anonymousId) {
      return {
        success: true,
        data: {
          averageSleepDuration: 8.0,
          averageSleepDurationTrend: 'stable',
          averageBedtime: '21:30',
          bedtimeStability: 85,
          nightWakes: 1,
          checkInStreak: 0,
          longestStreak: 0,
          weeklyData: generateSampleWeeklyData(),
          monthlyData: generateSampleMonthlyData(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    const endDate = new Date();
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    let checkIns: any[] = [];
    let allCheckIns: any[] = [];
    
    if (userId && childId) {
      checkIns = await prisma.checkIn.findMany({
        where: {
          childId,
          date: {
            gte: startDate.toISOString().split('T')[0],
            lte: endDate.toISOString().split('T')[0],
          },
        },
        orderBy: { date: 'asc' },
      });

      allCheckIns = await prisma.checkIn.findMany({
        where: { childId },
        orderBy: { date: 'desc' },
        take: 30,
      });
    } else if (anonymousId) {
      checkIns = await prisma.checkIn.findMany({
        where: {
          anonymousId,
          date: {
            gte: startDate.toISOString().split('T')[0],
            lte: endDate.toISOString().split('T')[0],
          },
        },
        orderBy: { date: 'asc' },
      });

      allCheckIns = await prisma.checkIn.findMany({
        where: { anonymousId },
        orderBy: { date: 'desc' },
        take: 30,
      });
    }

    if (checkIns.length === 0) {
      return {
        success: true,
        data: {
          averageSleepDuration: 8.0,
          averageSleepDurationTrend: 'stable',
          averageBedtime: '21:30',
          bedtimeStability: 85,
          nightWakes: 1,
          checkInStreak: 0,
          longestStreak: 0,
          weeklyData: generateSampleWeeklyData(),
          monthlyData: generateSampleMonthlyData(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    let totalSleepHours = 0;
    let totalBedtimeMinutes = 0;
    let totalNightWakes = 0;

    for (const checkIn of checkIns) {
      const sleepMinutes = calculateSleepDuration(checkIn.sleepTime, checkIn.wakeTime);
      totalSleepHours += sleepMinutes / 60;
      totalBedtimeMinutes += parseTimeToMinutes(checkIn.sleepTime);
      totalNightWakes += 1;
    }

    const averageSleepDuration = totalSleepHours / checkIns.length;
    const averageBedtime = formatMinutesToTime(Math.round(totalBedtimeMinutes / checkIns.length));

    const bedtimeDeviations = checkIns.map(c => {
      const minutes = parseTimeToMinutes(c.sleepTime);
      const average = Math.round(totalBedtimeMinutes / checkIns.length);
      return Math.abs(minutes - average);
    });
    const averageDeviation = bedtimeDeviations.reduce((a, b) => a + b, 0) / bedtimeDeviations.length;
    const bedtimeStability = Math.max(0, Math.min(100, 100 - (averageDeviation / 30) * 100));

    const streakResult = await calculateStreak(childId, anonymousId || null);

    const weeklyData = generateWeeklyData(checkIns);
    const monthlyData = generateMonthlyData(allCheckIns);

    return {
      success: true,
      data: {
        averageSleepDuration: Math.round(averageSleepDuration * 10) / 10,
        averageSleepDurationTrend: averageSleepDuration >= 8 ? 'stable' : 'up',
        averageBedtime,
        bedtimeStability: Math.round(bedtimeStability),
        nightWakes: Math.round(totalNightWakes / checkIns.length),
        checkInStreak: streakResult.streak,
        longestStreak: streakResult.longestStreak,
        weeklyData,
        monthlyData,
      },
      timestamp: new Date().toISOString(),
    };
  });
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateSleepDuration(sleepTime: string, wakeTime: string): number {
  const sleepMinutes = parseTimeToMinutes(sleepTime);
  let wakeMinutes = parseTimeToMinutes(wakeTime);

  if (wakeMinutes < sleepMinutes) {
    wakeMinutes += 24 * 60;
  }

  return wakeMinutes - sleepMinutes;
}

async function calculateStreak(childId: string | null, anonymousId: string | null) {
  let checkIns: any[] = [];
  if (childId) {
    checkIns = await prisma.checkIn.findMany({
      where: { childId },
      orderBy: { date: 'desc' },
    });
  } else if (anonymousId) {
    checkIns = await prisma.checkIn.findMany({
      where: { anonymousId },
      orderBy: { date: 'desc' },
    });
  } else {
    checkIns = [];
  }

  if (checkIns.length === 0) {
    return { streak: 0, longestStreak: 0 };
  }

  let streak = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date(today);

  for (const checkIn of checkIns) {
    const diff = Math.floor(
      (checkDate.getTime() - new Date(checkIn.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff <= 1) {
      currentStreak++;
      checkDate = new Date(checkIn.date);
    } else {
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      currentStreak = 1;
      checkDate = new Date(checkIn.date);
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const sortedCheckIns = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
  let maxStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedCheckIns.length; i++) {
    const diff = Math.floor(
      (new Date(sortedCheckIns[i].date).getTime() - new Date(sortedCheckIns[i - 1].date).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (diff === 1) {
      tempStreak++;
    } else {
      maxStreak = Math.max(maxStreak, tempStreak);
      tempStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak);

  streak = sortedCheckIns[0].date === today || sortedCheckIns[0].date === getYesterday() ? maxStreak : 0;

  return { streak, longestStreak };
}

function generateWeeklyData(checkIns: any[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data: { day: string; duration: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = days[date.getDay()];

    const checkIn = checkIns.find(c => c.date === dateStr);
    const duration = checkIn ? calculateSleepDuration(checkIn.sleepTime, checkIn.wakeTime) / 60 : 8 + Math.random() * 1;
    data.push({ day: dayName, duration: Math.round(duration * 10) / 10 });
  }

  return data;
}

function generateMonthlyData(checkIns: any[]) {
  const data: { day: string; duration: number }[] = [];

  for (let i = 29; i >= 0; i -= 5) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.getDate().toString();

    const checkIn = checkIns.find(c => {
      const checkInDate = new Date(c.date);
      return checkInDate.getDate() === parseInt(dateStr);
    });

    const duration = checkIn ? calculateSleepDuration(checkIn.sleepTime, checkIn.wakeTime) / 60 : 8 + Math.random() * 1;
    data.push({ day: dateStr, duration: Math.round(duration * 10) / 10 });
  }

  return data;
}

function generateSampleWeeklyData() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map(day => ({ day, duration: 8 + Math.random() * 1 }));
}

function generateSampleMonthlyData() {
  return ['1', '5', '10', '15', '20', '25', '30'].map(day => ({ day, duration: 8 + Math.random() * 1 }));
}

function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}
