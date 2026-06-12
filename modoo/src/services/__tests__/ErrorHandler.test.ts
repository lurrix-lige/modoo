import { errorHandler, ErrorHandler } from '../ErrorHandler';

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: {
    t: jest.fn((key: string) => {
      const translations: Record<string, string> = {
        'errors.unauthorized': '登录已过期，请重新登录',
        'errors.invalidToken': '登录凭证无效，请重新登录',
        'errors.tokenExpired': '登录已过期，请重新登录',
        'errors.networkError': '网络连接失败，请检查网络设置',
        'errors.timeout': '请求超时，请稍后重试',
        'errors.internalError': '服务器内部错误，请稍后重试',
      };
      return translations[key] || key;
    }),
    language: 'zh-CN',
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    errorHandler.clearLogs();
  });

  describe('getErrorMessage', () => {
    it('should return translated message for known error codes', () => {
      expect(errorHandler.getErrorMessage('UNAUTHORIZED', 'default')).toBe('登录已过期，请重新登录');
      expect(errorHandler.getErrorMessage('INVALID_TOKEN', 'default')).toBe('登录凭证无效，请重新登录');
      expect(errorHandler.getErrorMessage('NETWORK_ERROR', 'default')).toBe('网络连接失败，请检查网络设置');
    });

    it('should return default message for unknown error codes', () => {
      expect(errorHandler.getErrorMessage('UNKNOWN_CODE', 'fallback message')).toBe('fallback message');
    });
  });

  describe('isUnauthorizedError', () => {
    it('should identify auth error codes', () => {
      expect(errorHandler.isUnauthorizedError('UNAUTHORIZED')).toBe(true);
      expect(errorHandler.isUnauthorizedError('INVALID_TOKEN')).toBe(true);
      expect(errorHandler.isUnauthorizedError('TOKEN_EXPIRED')).toBe(true);
      expect(errorHandler.isUnauthorizedError('AUTH_TOKEN_MISSING')).toBe(true);
      expect(errorHandler.isUnauthorizedError('AUTH_TOKEN_INVALID')).toBe(true);
      expect(errorHandler.isUnauthorizedError('AUTH_TOKEN_EXPIRED')).toBe(true);
    });

    it('should identify auth error by status code', () => {
      expect(errorHandler.isUnauthorizedError('ANY_CODE', 401)).toBe(true);
    });

    it('should not identify non-auth errors', () => {
      expect(errorHandler.isUnauthorizedError('NETWORK_ERROR')).toBe(false);
      expect(errorHandler.isUnauthorizedError('NOT_FOUND')).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should identify network error codes', () => {
      expect(errorHandler.isNetworkError('NETWORK_ERROR')).toBe(true);
      expect(errorHandler.isNetworkError('TIMEOUT')).toBe(true);
      expect(errorHandler.isNetworkError('CONNECTION_REFUSED')).toBe(true);
    });

    it('should identify network error by status code', () => {
      expect(errorHandler.isNetworkError('ANY_CODE', 408)).toBe(true);
      expect(errorHandler.isNetworkError('ANY_CODE', 504)).toBe(true);
    });
  });

  describe('handleError', () => {
    it('should create and return error object', () => {
      const error = errorHandler.handleError('TEST_ERROR', 'Test message', 'error');
      expect(error).toHaveProperty('id');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.severity).toBe('error');
    });

    it('should add error to logs', () => {
      errorHandler.handleError('TEST_ERROR', 'Test message', 'warning');
      const logs = errorHandler.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].error.code).toBe('TEST_ERROR');
    });
  });

  describe('getErrorStatistics', () => {
    it('should track error statistics', () => {
      errorHandler.handleError('ERROR_1', 'Message 1', 'error');
      errorHandler.handleError('ERROR_2', 'Message 2', 'warning');
      errorHandler.handleError('ERROR_1', 'Message 1 again', 'error');

      const stats = errorHandler.getErrorStatistics();
      expect(stats.total).toBe(3);
      expect(stats.byCode['ERROR_1']).toBe(2);
      expect(stats.byCode['ERROR_2']).toBe(1);
    });
  });
});
