import { logger } from '../utils/logger';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'success';

export interface AppError {
  id: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: number;
  duration?: number;
  onRetry?: () => void;
  isAuthError?: boolean;
  userPath?: string[];
  metadata?: Record<string, any>;
}

export class ApiError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export interface ErrorHandlerConfig {
  onAuthError?: () => void;
  onNavigateToHome?: () => void;
  onError?: (error: AppError) => void;
}

type NavigationAction = 'navigateToAuth' | 'navigateToHome' | 'navigateToAuthWithReset';

interface ErrorLogEntry {
  error: AppError;
  userPath: string[];
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: number;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private listeners: Set<(error: AppError) => void> = new Set();
  private config: ErrorHandlerConfig = {};
  private pendingNavigation: NavigationAction | null = null;
  private errorLogs: ErrorLogEntry[] = [];
  private maxLogEntries = 100;
  private userPath: string[] = [];
  private listenersInitialized = false;
  private lastErrorTime = new Map<string, number>(); // 记录每个错误码的最后显示时间
  private errorDeduplicationWindow = 5000; // 5秒内的相同错误不重复显示

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  setConfig(config: ErrorHandlerConfig): void {
    this.config = { ...this.config, ...config };
  }

  setUserPath(path: string[]): void {
    this.userPath = path;
  }

  addToUserPath(screen: string): void {
    if (this.userPath[this.userPath.length - 1] !== screen) {
      this.userPath.push(screen);
      if (this.userPath.length > 20) {
        this.userPath = this.userPath.slice(-20);
      }
    }
  }

  getUserPath(): string[] {
    return [...this.userPath];
  }

  subscribe(listener: (error: AppError) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(error: AppError): void {
    const logEntry: ErrorLogEntry = {
      error,
      userPath: [...this.userPath],
      timestamp: new Date(),
      resolved: false,
    };
    this.addErrorLog(logEntry);

    const logData: Record<string, any> = {
      code: error.code,
      message: error.message,
      severity: error.severity,
      timestamp: logEntry.timestamp.toISOString(),
      userPath: this.userPath.join(' -> '),
    };
    if (error.metadata) {
      logData.metadata = error.metadata;
    }
    logger.error(`[ErrorHandler] ${error.severity.toUpperCase()}`, logData);

    this.listeners.forEach(listener => listener(error));
    this.config.onError?.(error);
  }

  private executePendingNavigation(): void {
    if (!this.pendingNavigation) return;
    const action = this.pendingNavigation;
    this.pendingNavigation = null;

    switch (action) {
      case 'navigateToAuth':
        this.config.onAuthError?.();
        break;
      case 'navigateToHome':
        this.config.onNavigateToHome?.();
        break;
      case 'navigateToAuthWithReset':
        this.config.onAuthError?.();
        break;
    }
  }

  generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  handleError(
    code: string,
    message: string,
    severity: ErrorSeverity = 'error',
    options?: {
      duration?: number;
      onRetry?: () => void;
      isAuthError?: boolean;
      metadata?: Record<string, any>;
    }
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      code,
      message,
      severity,
      timestamp: Date.now(),
      duration: options?.duration ?? (severity === 'error' ? 0 : 5000),
      onRetry: options?.onRetry,
      isAuthError: options?.isAuthError,
      userPath: [...this.userPath],
      metadata: options?.metadata,
    };

    // 检查是否需要去重
    const now = Date.now();
    const lastTime = this.lastErrorTime.get(code) || 0;
    
    // 如果是认证错误或在去重窗口内，只记录日志不显示
    if (this.isUnauthorizedError(code) && (now - lastTime) < this.errorDeduplicationWindow) {
      const logEntry: ErrorLogEntry = {
        error,
        userPath: [...this.userPath],
        timestamp: new Date(),
        resolved: false,
      };
      this.addErrorLog(logEntry);
      
      logger.debug(`[ErrorHandler] Duplicate auth error suppressed`, { code });
      return error;
    }
    
    // 更新最后显示时间
    this.lastErrorTime.set(code, now);

    if (error.isAuthError) {
      this.handleAuthError(error);
    } else {
      this.notify(error);
    }

    return error;
  }

  private handleAuthError(error: AppError): void {
    // 记录日志但不通知监听器（不弹出错误提示）
    const logEntry: ErrorLogEntry = {
      error,
      userPath: [...this.userPath],
      timestamp: new Date(),
      resolved: false,
    };
    this.addErrorLog(logEntry);
    
    const logData: Record<string, any> = {
      code: error.code,
      message: error.message,
      severity: error.severity,
      timestamp: logEntry.timestamp.toISOString(),
      userPath: this.userPath.join(' -> '),
    };
    logger.error(`[ErrorHandler] AUTH_ERROR`, logData);
    
    // 直接跳转到登录页，不弹出错误提示
    this.pendingNavigation = 'navigateToAuth';
    this.executePendingNavigation();
  }

  navigateToAuth(): void {
    this.pendingNavigation = 'navigateToAuth';
    this.executePendingNavigation();
  }

  navigateToHome(): void {
    this.pendingNavigation = 'navigateToHome';
    this.executePendingNavigation();
  }

  navigateToAuthWithReset(): void {
    this.pendingNavigation = 'navigateToAuthWithReset';
    this.executePendingNavigation();
  }

  isUnauthorizedError(code: string, statusCode?: number): boolean {
    return (
      code === 'UNAUTHORIZED' ||
      code === 'INVALID_TOKEN' ||
      code === 'TOKEN_EXPIRED' ||
      code === 'REFRESH_TOKEN_FAILED' ||
      code === 'AUTH_TOKEN_MISSING' ||
      code === 'AUTH_TOKEN_INVALID' ||
      code === 'AUTH_TOKEN_EXPIRED' ||
      code === 'AUTH_REFRESH_TOKEN_INVALID' ||
      code === 'AUTH_REFRESH_TOKEN_EXPIRED' ||
      statusCode === 401
    );
  }

  isNetworkError(code: string, statusCode?: number): boolean {
    return (
      code === 'NETWORK_ERROR' ||
      code === 'TIMEOUT' ||
      code === 'CONNECTION_REFUSED' ||
      statusCode === 0 ||
      statusCode === 408 ||
      statusCode === 504
    );
  }

  isServerError(code: string, statusCode?: number): boolean {
    return (
      statusCode === 500 ||
      statusCode === 502 ||
      statusCode === 503 ||
      code === 'INTERNAL_ERROR' ||
      code === 'BAD_GATEWAY' ||
      code === 'SERVICE_UNAVAILABLE'
    );
  }

  isValidationError(code: string): boolean {
    return (
      code === 'VALIDATION_ERROR' ||
      code === 'INVALID_INPUT' ||
      code === 'MISSING_REQUIRED_FIELD'
    );
  }

  isNotFoundError(code: string, statusCode?: number): boolean {
    return (
      code === 'NOT_FOUND' ||
      code === 'USER_NOT_FOUND' ||
      code === 'CHILD_NOT_FOUND' ||
      code === 'RESOURCE_NOT_FOUND' ||
      statusCode === 404
    );
  }

  getErrorMessage(code: string, defaultMessage: string): string {
    const errorMessages: Record<string, string> = {
      UNAUTHORIZED: '登录已过期，请重新登录',
      INVALID_TOKEN: '登录凭证无效，请重新登录',
      TOKEN_EXPIRED: '登录已过期，请重新登录',
      REFRESH_TOKEN_FAILED: '登录已过期，请重新登录',
      AUTH_TOKEN_MISSING: '请先登录',
      AUTH_TOKEN_INVALID: '登录凭证无效，请重新登录',
      AUTH_TOKEN_EXPIRED: '登录已过期，请重新登录',
      AUTH_REFRESH_TOKEN_INVALID: '登录凭证无效，请重新登录',
      AUTH_REFRESH_TOKEN_EXPIRED: '登录已过期，请重新登录',
      NETWORK_ERROR: '网络连接失败，请检查网络设置',
      TIMEOUT: '请求超时，请稍后重试',
      SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试',
      USER_NOT_FOUND: '用户不存在',
      CHILD_NOT_FOUND: '未找到宝宝信息，请先创建宝宝档案',
      NOT_FOUND: '请求的资源不存在',
      VALIDATION_ERROR: '输入数据验证失败',
      INTERNAL_ERROR: '服务器内部错误，请稍后重试',
    };

    return errorMessages[code] || defaultMessage;
  }

  getErrorSeverity(code: string, statusCode?: number): ErrorSeverity {
    if (this.isUnauthorizedError(code, statusCode)) return 'error';
    if (this.isNetworkError(code, statusCode)) return 'warning';
    if (this.isServerError(code, statusCode)) return 'error';
    if (this.isValidationError(code)) return 'warning';
    if (this.isNotFoundError(code, statusCode)) return 'info';
    return 'error';
  }

  private addErrorLog(entry: ErrorLogEntry): void {
    this.errorLogs.push(entry);
    if (this.errorLogs.length > this.maxLogEntries) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogEntries);
    }
  }

  resolveError(errorId: string, resolutionTime?: number): void {
    const entry = this.errorLogs.find(log => log.error.id === errorId);
    if (entry) {
      entry.resolved = true;
      entry.resolutionTime = resolutionTime;
    }
  }

  getErrorLogs(limit: number = 50): ErrorLogEntry[] {
    return this.errorLogs.slice(-limit);
  }

  getErrorStatistics(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCode: Record<string, number>;
    resolved: number;
    unresolved: number;
    averageResolutionTime: number;
  } {
    const stats = {
      total: this.errorLogs.length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCode: {} as Record<string, number>,
      resolved: 0,
      unresolved: 0,
      averageResolutionTime: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    this.errorLogs.forEach(log => {
      stats.bySeverity[log.error.severity] = (stats.bySeverity[log.error.severity] || 0) + 1;
      stats.byCode[log.error.code] = (stats.byCode[log.error.code] || 0) + 1;

      if (log.resolved) {
        stats.resolved++;
        if (log.resolutionTime) {
          totalResolutionTime += log.resolutionTime;
          resolvedCount++;
        }
      } else {
        stats.unresolved++;
      }
    });

    if (resolvedCount > 0) {
      stats.averageResolutionTime = totalResolutionTime / resolvedCount;
    }

    return stats;
  }

  clearLogs(): void {
    this.errorLogs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }

  importLogs(logsJson: string): void {
    try {
      const importedLogs = JSON.parse(logsJson) as ErrorLogEntry[];
      this.errorLogs = [...this.errorLogs, ...importedLogs].slice(-this.maxLogEntries);
    } catch (error) {
      logger.error('Failed to import error logs', { error });
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();
export default errorHandler;
