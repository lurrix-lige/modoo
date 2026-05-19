import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { registerV1Routes } from './v1';
import { registerCronJobs } from './services/CronService';
import { errorHandler } from './middleware/errorHandler';
import { initSentry } from './utils/sentry';
import { config, validateConfig } from './config';

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
  validateConfig();
  initSentry();

  const corsOrigin = config.server.corsOrigins.length > 0
    ? config.server.corsOrigins
    : (config.server.env === 'development' ? true : false);

  await fastify.register(cors, {
    origin: corsOrigin,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await fastify.register(sensible);

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Modoo API',
        description: 'Modoo (梦兜) Backend API Documentation',
        version: '1.0.0',
      },
      servers: [{ url: config.server.apiBaseUrl }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });

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
