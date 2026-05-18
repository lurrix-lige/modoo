import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { registerV1Routes } from './v1';
import { registerCronJobs } from './services/CronService';
import { errorHandler } from './middleware/errorHandler';
import { initSentry } from './utils/sentry';
import { config } from './config';

const fastify = Fastify({
  logger: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

const start = async () => {
  initSentry();

  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(sensible);

  fastify.setErrorHandler(errorHandler);

  fastify.get('/health', async () => {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  });

  await registerV1Routes(fastify);
  await registerCronJobs(fastify);

  try {
    const { host, port } = config.server;
    await fastify.listen({ port, host });
    fastify.log.info(`Server running at http://${host}:${port}`);
    fastify.log.info(`API v1 available at http://${host}:${port}/api/v1`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
