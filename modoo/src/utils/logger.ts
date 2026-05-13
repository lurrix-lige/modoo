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

function formatMessage(level: string, message: string, data?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
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