import { FastifyInstance } from 'fastify';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { storyRoutes } from './routes/stories';
import { courseRoutes } from './routes/courses';
import { breathingRoutes } from './routes/breathing';
import { checkInRoutes } from './routes/checkin';
import { articleRoutes } from './routes/articles';
import { dialogueRoutes } from './routes/dialogues';
import { expertRoutes } from './routes/experts';
import { membershipRoutes } from './routes/membership';
import { settingsRoutes } from './routes/settings';
import { contentRoutes } from './routes/content';
import { i18nRoutes } from './routes/i18n';
import { guardianSpiritRoutes } from './routes/guardianSpirit';
import { staticRoutes } from './routes/static';
import { paymentRoutes } from './routes/payment';

export async function registerV1Routes(fastify: FastifyInstance) {
  await fastify.register(async (instance) => {
    await instance.register(authRoutes, { prefix: '/auth' });
    await instance.register(userRoutes, { prefix: '/users' });
    await instance.register(storyRoutes, { prefix: '/stories' });
    await instance.register(courseRoutes, { prefix: '/courses' });
    await instance.register(breathingRoutes, { prefix: '/breathing' });
    await instance.register(checkInRoutes, { prefix: '/checkin' });
    await instance.register(articleRoutes, { prefix: '/articles' });
    await instance.register(dialogueRoutes, { prefix: '/dialogues' });
    await instance.register(expertRoutes, { prefix: '/experts' });
    await instance.register(membershipRoutes, { prefix: '/membership' });
    await instance.register(settingsRoutes, { prefix: '/settings' });
    await instance.register(contentRoutes, { prefix: '/content' });
    await instance.register(i18nRoutes, { prefix: '/i18n' });
    await instance.register(guardianSpiritRoutes, { prefix: '/guardian-spirits' });
    await instance.register(paymentRoutes, { prefix: '/payment' });
    await instance.register(staticRoutes, { prefix: '' });
  }, { prefix: '/api/v1' });
}
