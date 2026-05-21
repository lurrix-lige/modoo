const LOG_LEVEL = __DEV__ ? 'debug' : 'warn';

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[LOG_LEVEL as keyof typeof levels] || levels.info;

function shouldLog(level: keyof typeof levels): boolean {
  return levels[level] >= currentLevel;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join('\n'),
    };
  }
  if (typeof err === 'object' && err !== null) {
    return err as Record<string, unknown>;
  }
  return { value: String(err) };
}

function formatMessage(level: string, message: string, data?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  if (!data) {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }
  // Walk data and convert any Error values to serializable form
  const safeData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    safeData[key] = serializeError(value);
  }
  return `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(safeData)}`;
}

export const logger = {
  debug(message: string, data?: Record<string, any>): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, data));
    }
  },

  info(message: string, data?: Record<string, any>): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, data));
    }
  },

  warn(message: string, data?: Record<string, any>): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error(message: string, data?: Record<string, any>): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, data));
    }
  },
};

export default logger;