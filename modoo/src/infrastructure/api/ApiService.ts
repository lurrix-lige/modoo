import i18n from '../../i18n';
import { getTokenProvider } from '../auth/tokenProvider';
import { storageService } from '../storage/StorageService';
import { errorHandler, ApiError } from '../../services/ErrorHandler';
import { ErrorCodes } from '../../types/api';
import { API_CONFIG } from '../../config/env';
import { logger } from '../../utils/logger';

export { ApiError };
export type { ApiError as ApiErrorType };

const { BASE_URL, VERSION, TIMEOUT, RETRIES, RETRY_DELAY, MAX_REFRESH_RETRIES } = API_CONFIG;

class ApiService {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private lastActivityRecorded: number = 0;
  private readonly ACTIVITY_THROTTLE: number = 10000;

  constructor(
    baseUrl: string = BASE_URL,
    timeout: number = TIMEOUT,
    maxRetries: number = RETRIES,
    retryDelay: number = RETRY_DELAY,
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  private isRetryable(error: ApiError | Error): boolean {
    if (error instanceof ApiError) {
      const authErrorCodes: string[] = [
        'UNAUTHORIZED',
        'INVALID_TOKEN',
        'TOKEN_EXPIRED',
        'REFRESH_TOKEN_FAILED',
        ErrorCodes.AUTH_TOKEN_MISSING,
        ErrorCodes.AUTH_TOKEN_INVALID,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        ErrorCodes.AUTH_REFRESH_TOKEN_INVALID,
        ErrorCodes.AUTH_REFRESH_TOKEN_EXPIRED,
      ];
      if (authErrorCodes.includes(error.code) || error.statusCode === 401) {
        return false;
      }

      const retryableCodes: string[] = [
        ErrorCodes.SYS_TIMEOUT,
        ErrorCodes.SYS_SERVICE_UNAVAILABLE,
        ErrorCodes.SYS_INTERNAL_ERROR,
      ];
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableCodes.includes(error.code) || retryableStatuses.includes(error.statusCode);
    }
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createApiError(code: string, message: string, statusCode: number): ApiError {
    return new ApiError(code, message, statusCode);
  }

  private async requestInterceptor(
    endpoint: string,
    options: RequestInit,
  ): Promise<{ headers: Record<string, string>; shouldProceed: boolean }> {
    const headers: Record<string, string> = {
      'Accept-Language': i18n.language,
      ...(options.headers as Record<string, string>),
    };

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (getTokenProvider().isAuthenticated() && getTokenProvider().isSessionTimedOut()) {
      await getTokenProvider().clearAuth();
      return { headers, shouldProceed: false };
    }

    if (
      getTokenProvider().isAuthenticated() &&
      endpoint !== '/auth/refresh' &&
      getTokenProvider().isTokenExpiringSoon()
    ) {
      const newToken = await this.tryRefreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      } else {
        return { headers, shouldProceed: false };
      }
    } else {
      const accessToken = getTokenProvider().getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    if (!getTokenProvider().isAuthenticated() && !endpoint.startsWith('/anonymous')) {
      try {
        const anonymousId = await storageService.getOrCreateAnonymousId();
        headers['x-anonymous-id'] = anonymousId;
      } catch (error) {
        logger.warn('Failed to get anonymous ID', { error });
      }
    }

    return { headers, shouldProceed: true };
  }

  private async responseInterceptor<T>(
    response: Response,
    endpoint: string,
    options: RequestInit,
    retryCount: number,
    suppressError: boolean,
    refreshAttempts: number = 0,
  ): Promise<T> {
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { success: response.ok };
    }

    if (
      response.status === 401 &&
      getTokenProvider().isAuthenticated() &&
      refreshAttempts < MAX_REFRESH_RETRIES
    ) {
      logger.debug(
        `[ApiService] 401 response, attempting to refresh token (attempt ${refreshAttempts + 1})`,
      );

      const newToken = await this.tryRefreshToken();
      if (newToken) {
        logger.debug(`[ApiService] Token refreshed, retrying request`);
        return this.request<T>(endpoint, options, retryCount, suppressError, refreshAttempts + 1);
      } else {
        logger.debug(`[ApiService] Token refresh failed`);
      }
    }

    if (!response.ok) {
      const errorCode = data.error?.code || data.code || ErrorCodes.UNKNOWN_ERROR;
      const errorMessage = data.error?.message || data.message || `API Error: ${response.status}`;
      const errorDetails = data.error?.details;
      const apiError = this.createApiError(errorCode, errorMessage, response.status);
      (apiError as any).details = errorDetails;

      if (!suppressError) {
        const isAuthError = errorHandler.isUnauthorizedError(errorCode, response.status);
        const displayMessage = errorHandler.getErrorMessage(errorCode, errorMessage);
        errorHandler.handleError(errorCode, displayMessage, 'error', {
          isAuthError,
          duration: 0,
        });
      }

      throw apiError;
    }

    if (data.success !== undefined && !data.success) {
      const errorCode = data.error?.code || ErrorCodes.UNKNOWN_ERROR;
      const errorMessage = data.error?.message || 'API Request Failed';
      const errorDetails = data.error?.details;
      const apiError = this.createApiError(errorCode, errorMessage, 400);
      (apiError as any).details = errorDetails;

      if (!suppressError) {
        const isAuthError = errorHandler.isUnauthorizedError(errorCode, 400);
        const displayMessage = errorHandler.getErrorMessage(errorCode, errorMessage);
        errorHandler.handleError(errorCode, displayMessage, 'error', {
          isAuthError,
          duration: 0,
        });
      }

      throw apiError;
    }

    return data.data as T;
  }

  private async tryRefreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    if (!getTokenProvider().getRefreshToken()) {
      return null;
    }

    this.isRefreshing = true;

    try {
      logger.debug(`[ApiService] Starting token refresh`);
      const newToken = await getTokenProvider().refreshAccessToken();
      logger.debug(`[ApiService] Token refresh successful`);

      this.refreshSubscribers.forEach((callback) => callback(newToken));
      this.refreshSubscribers = [];

      return newToken;
    } catch (error: any) {
      logger.error(`[ApiService] Token refresh failed`, { error });

      await getTokenProvider().clearAuth();

      this.refreshSubscribers.forEach((callback) => callback(null));
      this.refreshSubscribers = [];

      const errorCode = error?.code || 'REFRESH_TOKEN_FAILED';
      const isAuthError = errorHandler.isUnauthorizedError(errorCode, error?.statusCode);

      if (isAuthError) {
        const displayMessage = errorHandler.getErrorMessage(
          errorCode,
          error?.message || i18n.t('auth.tokenRefreshFailed'),
        );
        errorHandler.handleError(errorCode, displayMessage, 'error', { isAuthError });
      }

      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0,
    suppressError: boolean = false,
    refreshAttempts: number = 0,
  ): Promise<T> {
    const isGetRequest = (options.method || 'GET') === 'GET';
    const requestKey = isGetRequest ? `${options.method || 'GET'}:${endpoint}` : '';

    if (isGetRequest && requestKey && this.pendingRequests.has(requestKey)) {
      logger.debug(`[ApiService] Reusing pending request for ${endpoint}`);
      return this.pendingRequests.get(requestKey) as Promise<T>;
    }

    const { headers, shouldProceed } = await this.requestInterceptor(endpoint, options);
    if (!shouldProceed) {
      throw this.createApiError(ErrorCodes.AUTH_TOKEN_INVALID, 'Session expired', 401);
    }

    const url = `${this.baseUrl}${VERSION}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const requestPromise = (async () => {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await this.responseInterceptor<T>(
          response,
          endpoint,
          options,
          retryCount,
          suppressError,
          refreshAttempts,
        );

        this.throttledRecordActivity();

        return result;
      } catch (error) {
        clearTimeout(timeoutId);

        let apiError: ApiError;
        if (error instanceof ApiError) {
          apiError = error;
        } else if (error instanceof Error && error.name === 'AbortError') {
          apiError = this.createApiError(ErrorCodes.SYS_TIMEOUT, i18n.t('api.timeout'), 408);
        } else if (error instanceof Error) {
          apiError = this.createApiError(
            ErrorCodes.SYS_SERVICE_UNAVAILABLE,
            error.message || i18n.t('api.requestFailed'),
            503,
          );
        } else {
          apiError = this.createApiError(ErrorCodes.UNKNOWN_ERROR, i18n.t('api.unknownError'), 500);
        }

        if (this.isRetryable(apiError) && retryCount < this.maxRetries) {
          const waitTime = this.retryDelay * (retryCount + 1);
          logger.debug(
            `[ApiService] Request failed, retrying in ${waitTime}ms... (Attempt ${retryCount + 1}/${this.maxRetries})`,
          );
          await this.delay(waitTime);
          return this.request<T>(endpoint, options, retryCount + 1, suppressError, refreshAttempts);
        }

        throw apiError;
      } finally {
        if (requestKey) {
          this.pendingRequests.delete(requestKey);
        }
      }
    })();

    if (isGetRequest && requestKey) {
      this.pendingRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
  }

  private throttledRecordActivity(): void {
    if (!getTokenProvider().isAuthenticated()) return;

    const now = Date.now();
    if (now - this.lastActivityRecorded >= this.ACTIVITY_THROTTLE) {
      this.lastActivityRecorded = now;
      getTokenProvider().recordActivity();
    }
  }

  async get<T>(endpoint: string, suppressError: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, 0, suppressError);
  }

  async post<T>(endpoint: string, body?: any, suppressError?: boolean): Promise<T> {
    const requestOptions: RequestInit = { method: 'POST' };

    if (body !== undefined && body !== null) {
      requestOptions.body = JSON.stringify(body);
    }

    return this.request<T>(endpoint, requestOptions, 0, suppressError);
  }

  async put<T>(endpoint: string, body?: any, suppressError?: boolean): Promise<T> {
    const requestBody = body ?? {};
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      },
      0,
      suppressError,
    );
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
