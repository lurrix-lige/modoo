import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const SENTRY_DSN = process.env.SENTRY_DSN || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

export function initSentry(): void {
  if (!SENTRY_DSN || NODE_ENV === 'development') {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
    integrations: [
      Sentry.httpIntegration(),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

export { Sentry };
