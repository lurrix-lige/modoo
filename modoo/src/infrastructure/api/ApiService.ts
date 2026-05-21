import i18n from '../../i18n';
import { authService } from '../auth/AuthService';
import { storageService } from '../storage/StorageService';
import { errorHandler, ApiError } from '../../services/ErrorHandler';
import { ApiResponse, ErrorCodes } from '../../types/api';
import { API_CONFIG } from '../../config/env';
import { logger } from '../../utils/logger';

const { BASE_URL, VERSION, TIMEOUT, RETRIES, RETRY_DELAY, MAX_REFRESH_RETRIES } = API_CONFIG;

export { ApiError };

class ApiService {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private isRefreshing: boolean = false; // 防止并发刷新
  private refreshSubscribers: Array<(token: string | null) => void> = []; // 等待刷新的订阅者
  private pendingRequests: Map<string, Promise<any>> = new Map(); // 请求去重
  private lastActivityRecorded: number = 0; // 记录最后一次活动的时间
  private readonly ACTIVITY_THROTTLE: number = 10000; // 活动记录节流 10秒

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
      // 认证错误绝对不重试
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

      // 只有网络错误、服务器错误等可重试
      const retryableCodes: string[] = [
        ErrorCodes.SYS_TIMEOUT,
        ErrorCodes.SYS_SERVICE_UNAVAILABLE,
        ErrorCodes.SYS_INTERNAL_ERROR,
      ];
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableCodes.includes(error.code) || retryableStatuses.includes(error.statusCode);
    }
    // 网络错误可以重试
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createApiError(code: string, message: string, statusCode: number): ApiError {
    return new ApiError(code, message, statusCode);
  }

  /**
   * 请求拦截器：在发送请求前进行处理
   */
  private async requestInterceptor(
    endpoint: string,
    options: RequestInit,
  ): Promise<{ headers: Record<string, string>; shouldProceed: boolean }> {
    const headers: Record<string, string> = {
      'Accept-Language': i18n.language,
      ...(options.headers as Record<string, string>),
    };

    // 只有当请求有 body 时才设置 Content-Type
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    // 1. 检查会话是否超时
    if (authService.isAuthenticated() && authService.isSessionTimedOut()) {
      await authService.clearAuth();
      return { headers, shouldProceed: false };
    }

    // 2. 检查是否需要刷新 Token
    if (authService.isAuthenticated() && authService.isTokenExpiringSoon()) {
      const newToken = await this.tryRefreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      } else {
        return { headers, shouldProceed: false };
      }
    } else {
      // 添加正常的 Token
      const accessToken = authService.getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    // 3. 添加匿名用户ID（如果用户未登录且不是匿名接口本身，防止循环调用）
    if (!authService.isAuthenticated() && !endpoint.startsWith('/anonymous')) {
      try {
        const anonymousId = await storageService.getOrCreateAnonymousId();
        headers['x-anonymous-id'] = anonymousId;
      } catch (error) {
        logger.warn('Failed to get anonymous ID', { error });
      }
    }

    return { headers, shouldProceed: true };
  }

  /**
   * 响应拦截器：处理响应，特别是 401 错误
   */
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

    // 处理 401 错误 - 可能需要刷新 Token
    if (
      response.status === 401 &&
      authService.isAuthenticated() &&
      refreshAttempts < MAX_REFRESH_RETRIES
    ) {
      logger.debug(
        `[ApiService] 401 response, attempting to refresh token (attempt ${refreshAttempts + 1})`,
      );

      const newToken = await this.tryRefreshToken();
      if (newToken) {
        // 刷新成功，用新 Token 重试
        logger.debug(`[ApiService] Token refreshed, retrying request`);
        return this.request<T>(endpoint, options, retryCount, suppressError, refreshAttempts + 1);
      } else {
        // 刷新失败，抛出错误
        logger.debug(`[ApiService] Token refresh failed`);
      }
    }

    // 处理其他错误
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

  /**
   * 尝试刷新 Token，使用单例模式防止并发刷新
   */
  private async tryRefreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // 已经在刷新中，等待结果
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    if (!authService.getRefreshToken()) {
      return null;
    }

    this.isRefreshing = true;

    try {
      logger.debug(`[ApiService] Starting token refresh`);
      const newToken = await authService.refreshAccessToken();
      logger.debug(`[ApiService] Token refresh successful`);

      this.refreshSubscribers.forEach((callback) => callback(newToken));
      this.refreshSubscribers = [];

      return newToken;
    } catch (error: any) {
      logger.error(`[ApiService] Token refresh failed`, { error });

      // 确保清除认证状态
      await authService.clearAuth();

      // 通知所有订阅者刷新失败
      this.refreshSubscribers.forEach((callback) => callback(null));
      this.refreshSubscribers = [];

      // 检查是否是认证错误，如果是，通知错误处理器
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

  /**
   * 主请求方法，整合拦截器逻辑
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0,
    suppressError: boolean = false,
    refreshAttempts: number = 0,
  ): Promise<T> {
    // 只对 GET 请求进行去重
    const isGetRequest = (options.method || 'GET') === 'GET';
    const requestKey = isGetRequest ? `${options.method || 'GET'}:${endpoint}` : '';

    // 如果是 GET 请求且已有相同请求在进行中，直接返回该请求的 Promise
    if (isGetRequest && requestKey && this.pendingRequests.has(requestKey)) {
      logger.debug(`[ApiService] Reusing pending request for ${endpoint}`);
      return this.pendingRequests.get(requestKey) as Promise<T>;
    }

    // 1. 请求拦截
    const { headers, shouldProceed } = await this.requestInterceptor(endpoint, options);
    if (!shouldProceed) {
      throw this.createApiError(ErrorCodes.AUTH_TOKEN_INVALID, 'Session expired', 401);
    }

    const url = `${this.baseUrl}${VERSION}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // 创建请求 Promise
    const requestPromise = (async () => {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 2. 响应拦截
        const result = await this.responseInterceptor<T>(
          response,
          endpoint,
          options,
          retryCount,
          suppressError,
          refreshAttempts,
        );

        // 3. 记录用户活动（节流）
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

        // 错误重试
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
        // 请求完成后从 pendingRequests 中移除
        if (requestKey) {
          this.pendingRequests.delete(requestKey);
        }
      }
    })();

    // 如果是 GET 请求，缓存到 pendingRequests
    if (isGetRequest && requestKey) {
      this.pendingRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
  }

  /**
   * 节流的活动记录
   */
  private throttledRecordActivity(): void {
    if (!authService.isAuthenticated()) return;

    const now = Date.now();
    if (now - this.lastActivityRecorded >= this.ACTIVITY_THROTTLE) {
      this.lastActivityRecorded = now;
      authService.recordActivity();
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

  async getStories(): Promise<StoriesResponse> {
    return this.get<StoriesResponse>('/stories');
  }

  async getStory(storyId: string): Promise<Story> {
    return this.get<Story>(`/stories/${storyId}`);
  }

  async favoriteStory(storyId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    return this.post<{ success: boolean; isFavorite: boolean }>(`/stories/${storyId}/favorite`, {});
  }

  async unfavoriteStory(storyId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    return this.delete<{ success: boolean; isFavorite: boolean }>(`/stories/${storyId}/favorite`);
  }

  async shareStory(
    storyId: string,
    platform?: string,
  ): Promise<{ success: boolean; shareId: string }> {
    return this.post<{ success: boolean; shareId: string }>(
      `/stories/${storyId}/share`,
      platform ? { platform } : {},
    );
  }

  async updateStoryProgress(storyId: string, progress: number, completed: boolean): Promise<void> {
    return this.post<void>(`/stories/${storyId}/progress`, { progress, completed });
  }

  async getStoryStats(): Promise<StoryStatsResponse> {
    return this.get<StoryStatsResponse>('/stories/stats/summary');
  }

  async getCourses(): Promise<CoursesResponse> {
    return this.get<CoursesResponse>('/courses');
  }

  async getCourse(courseId: string): Promise<Course> {
    return this.get<Course>(`/courses/${courseId}`);
  }

  async completeLesson(lessonId: string): Promise<void> {
    return this.post<void>(`/courses/lessons/${lessonId}/complete`);
  }

  async getArticles(): Promise<ArticlesResponse> {
    return this.get<ArticlesResponse>('/articles');
  }

  async getArticle(articleId: string): Promise<Article> {
    const id = articleId.replace(/^\/|\/$/g, '');
    return this.get<Article>(`/articles/${id}`);
  }

  async favoriteArticle(articleId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    const id = articleId.replace(/^\/|\/$/g, '');
    return this.post<{ success: boolean; isFavorite: boolean }>(`/articles/${id}/favorite`, {});
  }

  async unfavoriteArticle(articleId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    const id = articleId.replace(/^\/|\/$/g, '');
    return this.delete<{ success: boolean; isFavorite: boolean }>(`/articles/${id}/favorite`);
  }

  async shareArticle(
    articleId: string,
    platform?: string,
  ): Promise<{ success: boolean; shareId: string }> {
    const id = articleId.replace(/^\/|\/$/g, '');
    return this.post<{ success: boolean; shareId: string }>(
      `/articles/${id}/share`,
      platform ? { platform } : {},
    );
  }

  async getFavoriteArticles(): Promise<ArticlesResponse> {
    return this.get<ArticlesResponse>('/articles/favorites', true);
  }

  async getFavoriteStories(): Promise<StoriesResponse> {
    return this.get<StoriesResponse>('/stories/favorites', true);
  }

  async getFavoriteDialogues(): Promise<DialoguesResponse> {
    return this.get<DialoguesResponse>('/dialogues/favorites', true);
  }

  async getDialogues(): Promise<DialoguesResponse> {
    return this.get<DialoguesResponse>('/dialogues');
  }

  async getDialogue(dialogueId: string): Promise<Dialogue> {
    const id = dialogueId.replace(/^\/|\/$/g, '');
    return this.get<Dialogue>(`/dialogues/${id}`);
  }

  async favoriteDialogue(dialogueId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    const id = dialogueId.replace(/^\/|\/$/g, '');
    return this.post<{ success: boolean; isFavorite: boolean }>(`/dialogues/${id}/favorite`, {});
  }

  async unfavoriteDialogue(dialogueId: string): Promise<{ success: boolean; isFavorite: boolean }> {
    const id = dialogueId.replace(/^\/|\/$/g, '');
    return this.delete<{ success: boolean; isFavorite: boolean }>(`/dialogues/${id}/favorite`);
  }

  async useDialogue(dialogueId: string): Promise<{ success: boolean; useCount: number }> {
    const id = dialogueId.replace(/^\/|\/$/g, '');
    return this.post<{ success: boolean; useCount: number }>(`/dialogues/${id}/use`, {});
  }

  async getBreathingExercises(): Promise<BreathingResponse> {
    return this.get<BreathingResponse>('/breathing/exercises');
  }

  async getBreathingExercise(exerciseId: string): Promise<BreathingExerciseDetail> {
    return this.get<BreathingExerciseDetail>(`/breathing/exercises/${exerciseId}`);
  }

  async getWhiteNoises(): Promise<WhiteNoisesResponse> {
    return this.get<WhiteNoisesResponse>('/breathing/white-noises');
  }

  async getWhiteNoiseCategories(): Promise<WhiteNoiseCategoriesResponse> {
    return this.get<WhiteNoiseCategoriesResponse>('/breathing/white-noises/categories');
  }

  async getExperts(): Promise<ExpertsResponse> {
    return this.get<ExpertsResponse>('/experts');
  }

  async getExpert(expertId: string): Promise<Expert> {
    return this.get<Expert>(`/experts/${expertId}`);
  }

  async getExpertTimeSlots(expertId: string, date: string): Promise<ExpertTimeSlots> {
    return this.get<ExpertTimeSlots>(`/experts/${expertId}/time-slots?date=${date}`);
  }

  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    return this.post<Booking>('/experts/bookings', data);
  }

  async getMyBookings(): Promise<Booking[]> {
    return this.get<Booking[]>('/experts/bookings/my');
  }

  async getBookings(): Promise<{ bookings: Booking[] }> {
    const bookings = await this.get<Booking[]>('/experts/bookings/my');
    return { bookings };
  }

  async cancelBooking(bookingId: string): Promise<{ success: boolean }> {
    const id = bookingId.replace(/^\/|\/$/g, '');
    return this.post<{ success: boolean }>(`/experts/bookings/${id}/cancel`, {});
  }

  async updateBooking(bookingId: string, status: string): Promise<Booking> {
    return this.put<Booking>(`/experts/bookings/${bookingId}`, { status });
  }

  async checkIn(data: CheckInRequest): Promise<CheckInResponse> {
    return this.post<CheckInResponse>('/checkin', data);
  }

  async getStreak(): Promise<StreakResponse> {
    return this.get<StreakResponse>('/checkin/streak', true);
  }

  async getCheckInHistory(): Promise<CheckInResponse[]> {
    return this.get<CheckInResponse[]>('/checkin/history', true);
  }

  async getTodayCheckIn(): Promise<CheckInResponse | null> {
    try {
      return await this.get<CheckInResponse>('/checkin/today', true);
    } catch {
      return null;
    }
  }

  async getMembershipPlans(): Promise<MembershipPlan[]> {
    try {
      const response = await this.get<MembershipPlanList>('/membership/plans');
      if (!response) {
        return [];
      }
      if (Array.isArray(response)) {
        return response;
      }
      return response.plans || [];
    } catch (error) {
      logger.error('Failed to load membership plans, returning empty array', { error });
      return [];
    }
  }

  async getCurrentMembership(): Promise<CurrentMembership> {
    return this.get<CurrentMembership>('/membership/current');
  }

  async subscribe(planId: string, suppressError?: boolean): Promise<void> {
    return this.post<void>('/membership/subscribe', { planId }, suppressError);
  }

  async cancelMembership(): Promise<void> {
    return this.post<void>('/membership/cancel');
  }

  async getMembershipStatus(): Promise<MembershipStatusResponse> {
    return this.get<MembershipStatusResponse>('/membership/status');
  }

  async checkAccess(contentId?: string, contentType?: string): Promise<AccessCheckResponse> {
    const params = new URLSearchParams();
    if (contentId) params.append('contentId', contentId);
    if (contentType) params.append('contentType', contentType);
    const query = params.toString();
    return this.get<AccessCheckResponse>(`/membership/access/check${query ? `?${query}` : ''}`);
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return this.post<Order>('/membership/orders', data);
  }

  async getOrders(): Promise<OrdersResponse> {
    return this.get<OrdersResponse>('/membership/orders');
  }

  async getOrderDetail(orderId: string): Promise<Order> {
    return this.get<Order>(`/membership/orders/${orderId}`);
  }

  async getOrderByNo(orderNo: string): Promise<Order> {
    return this.get<Order>(`/membership/orders/orderNo/${orderNo}`);
  }

  async payOrder(orderId: string, paymentMethod?: string): Promise<PaymentResponse> {
    return this.post<PaymentResponse>(`/membership/orders/${orderId}/pay`, {
      paymentMethod: paymentMethod || 'wechat',
    });
  }

  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    return this.post<CancelOrderResponse>(`/membership/orders/${orderId}/cancel`, {});
  }

  async getTransactions(): Promise<TransactionsResponse> {
    return this.get<TransactionsResponse>('/membership/transactions');
  }

  async getSubscriptions(): Promise<SubscriptionsResponse> {
    return this.get<SubscriptionsResponse>('/membership/subscriptions');
  }

  async updateSubscription(
    subscriptionId: string,
    data: UpdateSubscriptionRequest,
  ): Promise<Subscription> {
    return this.put<Subscription>(`/membership/subscriptions/${subscriptionId}`, data);
  }

  async getBenefits(): Promise<BenefitsResponse> {
    return this.get<BenefitsResponse>('/membership/benefits');
  }

  async getBenefit(benefitId: string): Promise<Benefit> {
    return this.get<Benefit>(`/membership/benefits/${benefitId}`);
  }

  async getBenefitByKey(benefitKey: string): Promise<Benefit> {
    return this.get<Benefit>(`/membership/benefits/key/${benefitKey}`);
  }

  async getBenefitsByProduct(productType: string): Promise<BenefitsResponse> {
    return this.get<BenefitsResponse>(`/membership/benefits/product/${productType}`);
  }

  async getMembershipPlan(planId: string): Promise<MembershipPlan> {
    return this.get<MembershipPlan>(`/membership/plans/${planId}`);
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/users/profile');
  }

  async updateUserProfile(
    data: Partial<Pick<UserProfile, 'nickname' | 'avatar'>>,
  ): Promise<UserProfile> {
    return this.put<UserProfile>('/users/profile', data);
  }

  async getChildProfile(): Promise<ChildProfile | null> {
    try {
      return await this.get<ChildProfile>('/users/child', true);
    } catch {
      return null;
    }
  }

  async createChildProfile(data: CreateChildRequest): Promise<ChildProfile> {
    return this.post<ChildProfile>('/users/child', data);
  }

  async updateChildProfile(data: Partial<CreateChildRequest>): Promise<ChildProfile> {
    return this.put<ChildProfile>('/users/child', data);
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    return this.get<NotificationSettings>('/settings/notifications');
  }

  async updateNotificationSettings(data: NotificationSettings): Promise<NotificationSettings> {
    return this.put<NotificationSettings>('/settings/notifications', data);
  }

  async registerPushToken(data: {
    token: string;
    platform: string;
  }): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/users/push-token', data);
  }

  async getPrivacySettings(): Promise<PrivacySettings> {
    return this.get<PrivacySettings>('/settings/privacy');
  }

  async updatePrivacySettings(data: PrivacySettings): Promise<PrivacySettings> {
    return this.put<PrivacySettings>('/settings/privacy', data);
  }

  async exportUserData(): Promise<ExportDataResponse> {
    return this.post<ExportDataResponse>('/settings/export', {});
  }

  async deleteAccount(): Promise<DeleteAccountResponse> {
    return this.post<DeleteAccountResponse>('/settings/delete', {});
  }

  async getContentRecommendations(): Promise<ContentRecommendationsResponse> {
    return this.get<ContentRecommendationsResponse>('/content/recommendations');
  }

  async getSleepStats(period: 'week' | 'month' = 'week'): Promise<SleepStatsResponse> {
    return this.get<SleepStatsResponse>(`/checkin/stats?period=${period}`);
  }

  async getGuardianSpirits(): Promise<GuardianSpiritsResponse> {
    return this.get<GuardianSpiritsResponse>('/guardian-spirits');
  }

  async getGuardianSpirit(spiritId: string): Promise<GuardianSpirit> {
    return this.get<GuardianSpirit>(`/guardian-spirits/${spiritId}`);
  }

  async getDefaultGuardianSpirit(): Promise<GuardianSpirit> {
    return this.get<GuardianSpirit>('/guardian-spirits/default');
  }

  async getPromotions(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    type?: string;
    code?: string;
  }): Promise<PromotionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.code) queryParams.append('code', params.code);
    const query = queryParams.toString();
    return this.get<PromotionsResponse>(`/promotions${query ? `?${query}` : ''}`);
  }

  async getPromotion(promotionId: string): Promise<Promotion> {
    return this.get<Promotion>(`/promotions/${promotionId}`);
  }

  async getPromotionByCode(code: string): Promise<Promotion> {
    return this.get<Promotion>(`/promotions/code/${code}`);
  }

  async reportAnalyticsEvent(data: AnalyticsEventRequest): Promise<{ eventId: string }> {
    return this.post<{ eventId: string }>('/analytics/events', data);
  }

  async reportAnalyticsBatchEvents(
    batchId: string,
    deviceId: string,
    events: AnalyticsEventRequest[],
  ): Promise<{
    batchId: string;
    eventsProcessed: number;
  }> {
    return this.post<{ batchId: string; eventsProcessed: number }>('/analytics/events/batch', {
      batchId,
      deviceId,
      events,
    });
  }

  async reportAnalyticsSession(data: AnalyticsSessionRequest): Promise<{ sessionId: string }> {
    return this.post<{ sessionId: string }>('/analytics/sessions', data);
  }

  async reportAnalyticsProfile(data: AnalyticsProfileRequest): Promise<AnalyticsUserProfile> {
    return this.post<AnalyticsUserProfile>('/analytics/profile', data);
  }

  async reportAnalyticsFeatureUsage(
    data: AnalyticsFeatureUsageRequest,
  ): Promise<AnalyticsFeatureUsage> {
    return this.post<AnalyticsFeatureUsage>('/analytics/feature-usage', data);
  }

  async reportAnalyticsError(data: AnalyticsErrorRequest): Promise<{ errorId: string }> {
    return this.post<{ errorId: string }>('/analytics/errors', data);
  }

  async getServices(): Promise<Service[]> {
    return [
      {
        id: 'expert',
        titleKey: 'services.expert',
        descKey: 'services.expertDesc',
        icon: 'headset',
        colorKey: 'info',
      },
      {
        id: 'course',
        titleKey: 'services.course',
        descKey: 'services.courseDesc',
        icon: 'school',
        colorKey: 'success',
      },
      {
        id: 'report',
        titleKey: 'services.report',
        descKey: 'services.reportDesc',
        icon: 'document-text',
        colorKey: 'primary',
      },
    ];
  }

  // ==============================================
  // 👤 匿名用户管理 API
  // ==============================================

  /**
   * 生成新的匿名用户ID
   * GET /api/v1/anonymous/generate
   */
  async generateAnonymousId(deviceId?: string): Promise<AnonymousGenerateResponse> {
    const options: RequestInit = { method: 'GET' };
    if (deviceId) {
      options.headers = { 'x-device-id': deviceId };
    }
    return this.request<AnonymousGenerateResponse>('/anonymous/generate', options, 0, true);
  }

  /**
   * 验证匿名用户ID是否有效
   * POST /api/v1/anonymous/validate
   */
  async validateAnonymousId(anonymousId: string): Promise<AnonymousValidateResponse> {
    return this.post<AnonymousValidateResponse>('/anonymous/validate', { anonymousId }, true);
  }

  /**
   * 获取匿名用户统计数据
   * POST /api/v1/anonymous/stats
   */
  async getAnonymousStats(anonymousId: string): Promise<AnonymousStatsResponse> {
    return this.post<AnonymousStatsResponse>('/anonymous/stats', { anonymousId }, true);
  }

  /**
   * 登录后迁移匿名用户数据
   * POST /api/v1/anonymous/migrate
   */
  async migrateAnonymousData(anonymousId: string): Promise<AnonymousMigrationResponse> {
    return this.post<AnonymousMigrationResponse>('/anonymous/migrate', { anonymousId });
  }
}

export interface Service {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  colorKey: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  onPress?: () => void;
}

export interface MembershipPlanDetail {
  id: string;
  nameKey: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  notIncluded?: string[];
  isRecommended: boolean;
  saving?: string;
  savingPercent?: number;
}

export interface NotificationSettings {
  sleepReminder: boolean;
  checkInReminder: boolean;
  reportNotification: boolean;
  expertReminder: boolean;
  activityReminder: boolean;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  personalizedRecommendations: boolean;
}

export interface ExportDataResponse {
  success: boolean;
  downloadUrl: string;
}

export interface DeleteAccountResponse {
  success: boolean;
}

export interface LoginRequest {
  phone: string;
  code: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string;
    nickname: string;
    avatar?: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SendCodeRequest {
  phone: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  isPaid: boolean;
  membership?: {
    plan: string;
    startedAt: string | Date;
    expiresAt: string | Date;
  } | null;
  child?: ChildProfile | null;
}

export interface ChildProfile {
  id: string;
  userId?: string;
  nickname: string;
  birthday: string;
  gender: 'male' | 'female' | string;
  guardianSpiritId?: string;
  guardianIP?: string;
  guardianSpirit?: GuardianSpirit;
  sleepProblems?: string | string[];
  createdAt?: string;
}

export interface CreateChildRequest {
  nickname: string;
  birthday: string;
  gender: string;
  guardianSpiritId?: string;
  sleepProblems?: string;
}

export interface Story {
  id: string;
  titleKey?: string;
  title: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  category: string;
  descriptionKey?: string;
  description?: string;
  progress?: number;
  completed?: boolean;
  isFavorite?: boolean;
  isPremium?: boolean;
}

export interface StoriesResponse {
  stories: Story[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Course {
  id: string;
  level: number;
  name: string;
  nameKey?: string;
  description: string;
  descriptionKey?: string;
  imageUrl: string;
  totalLessons: number;
  isUnlocked: boolean;
  difficulty: string;
  completedLessons?: number;
  lessons?: Lesson[];
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  titleKey?: string;
  name?: string;
  duration: number;
  type: string;
  contentUrl: string;
  isCompleted?: boolean;
  backgroundMusicUrl?: string;
  voiceGuideUrl?: string;
  description?: string;
}

export interface BreathingPhase {
  type: string;
  duration: number;
  label: string;
}

export interface BreathingExercise {
  id: string;
  nameKey: string;
  name?: string;
  descriptionKey: string;
  description?: string;
  difficulty: string;
  phases: BreathingPhase[];
  icon?: string;
  color?: string;
}

export interface BreathingResponse {
  exercises: BreathingExercise[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WhiteNoise {
  id: string;
  nameKey: string;
  name?: string;
  category: string;
  audioUrl: string;
  icon?: string;
  color?: string;
  isPremium: boolean;
  isLoopable?: boolean;
  previewDuration?: number;
  sortOrder?: number;
}

export interface WhiteNoisesResponse {
  noises: WhiteNoise[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Article {
  id: string;
  title: string;
  titleKey?: string;
  category: string;
  categoryKey?: string;
  coverUrl?: string;
  summary: string;
  summaryKey?: string;
  readTime: number;
  views: number;
  likes?: number;
  publishDate?: string;
  publishedAt?: string;
  content?: string;
  contentKey?: string;
  tags?: string[];
  isFavorited?: boolean;
  isPremium?: boolean;
  accessTier?: string;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Dialogue {
  id: string;
  titleKey: string;
  title?: string;
  scenarioKey?: string;
  scenario?: string;
  responseKey: string;
  response?: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  useCount: number;
  isFavorite?: boolean;
}

export interface DialoguesResponse {
  dialogues: Dialogue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Expert {
  id: string;
  nameKey: string;
  name?: string;
  titleKey: string;
  title?: string;
  avatarUrl: string;
  hospitalKey: string;
  hospital?: string;
  specialtyKeys: string[];
  specialties?: string[];
  experience: number;
  consultationPrice: number;
  rating: number;
  reviewCount: number;
  availableTimes?: string[];
}

export interface ExpertsResponse {
  experts: Expert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Booking {
  id: string;
  expertId: string;
  userId: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  expert?: Expert;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  expertId: string;
  date: string;
  time: string;
  notes?: string;
}

export interface CheckInRequest {
  date: string;
  sleepTime: string;
  wakeTime: string;
  quality: number;
}

export interface CheckInResponse {
  id: string;
  date: string;
  sleepTime: string;
  wakeTime: string;
  quality: number;
}

export interface StreakResponse {
  streak: number;
  longestStreak: number;
  totalDays: number;
}

export interface MembershipPlan {
  id: string;
  planKey: string;
  nameKey?: string;
  name?: string;
  currentPrice?: number;
  originalPrice?: number;
  price?: number;
  saving?: string;
  savingPercent?: number;
  durationDays: number;
  recommended?: boolean;
  features: string[];
  notIncluded?: string[];
}

export interface GuardianSpirit {
  id: string;
  nameKey: string;
  descriptionKey?: string;
  icon: 'moon' | 'star' | 'shield-checkmark' | 'zap';
  color: string;
  type: string;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface MembershipPlansResponse {
  plans?: MembershipPlan[];
}

export type MembershipPlanList = MembershipPlan[] | MembershipPlansResponse;

export interface CurrentMembership {
  active: boolean;
  plan: string | null;
  startedAt?: string;
  expiresAt?: string;
}

export interface ContentItem {
  id: string;
  type: 'story' | 'breathing' | 'course' | 'article';
  titleKey?: string;
  title?: string;
  descriptionKey?: string;
  description?: string;
  duration?: number;
  isPremium: boolean;
  priority: number;
  coverUrl?: string;
  icon?: string;
}

export interface ContentRecommendationsResponse {
  featuredContent: ContentItem[];
  categoryContent: {
    [key: string]: ContentItem[];
  };
}

export interface StoryStatsResponse {
  storiesCompleted: number;
  totalStories: number;
  favoritesCount: number;
  recentlyPlayed: {
    id: string;
    title: string;
    coverUrl?: string;
    lastPlayedAt: string;
  }[];
}

export interface SleepStatsResponse {
  averageSleepDuration: number;
  averageSleepDurationTrend: 'up' | 'down' | 'stable';
  averageBedtime: string;
  bedtimeStability: number;
  nightWakes: number;
  checkInStreak: number;
  longestStreak: number;
  weeklyData: { day: string; duration: number }[];
  monthlyData: { day: string; duration: number }[];
}

export interface MembershipStatusResponse {
  isActive: boolean;
  plan: string | null;
  planId: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
}

export interface AccessCheckResponse {
  hasAccess: boolean;
  reason?: string;
  requiredPlan?: string;
  upgradeAvailable: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  planId: string;
  planName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  subscriptionId?: string;
  items?: OrderItem[];
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  paymentMethod?: string;
  paymentChannel?: string;
  transactionId?: string;
  paidAt?: string;
  expiredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  refundAmount?: number;
  refundedAt?: string;
  refundReason?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  planId: string;
  promotionCode?: string;
  paymentMethod?: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentResponse {
  success: boolean;
  orderId: string;
  paymentUrl?: string;
  qrCode?: string;
  expireTime?: string;
}

export interface CancelOrderResponse {
  success: boolean;
  orderId: string;
  refundAmount?: number;
  refundStatus?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'CHARGE' | 'REFUND' | 'SUBSCRIPTION' | 'RENEWAL';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIALING';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  cancelledAt?: string;
  createdAt: string;
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateSubscriptionRequest {
  autoRenew?: boolean;
  cancelledAt?: string;
}

export interface Benefit {
  id: string;
  benefitKey: string;
  nameKey: string;
  descriptionKey?: string;
  icon?: string;
  type: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface BenefitsResponse {
  benefits: Benefit[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BreathingExerciseDetail {
  id: string;
  nameKey: string;
  name?: string;
  descriptionKey: string;
  description?: string;
  difficulty: string;
  phases: BreathingPhase[];
  totalDuration: number;
  icon?: string;
  color?: string;
  tips?: string[];
}

export interface WhiteNoiseCategory {
  id: string;
  nameKey: string;
  name?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
}

export interface WhiteNoiseCategoriesResponse {
  categories: WhiteNoiseCategory[];
}

export interface ExpertTimeSlots {
  expertId: string;
  date: string;
  slots: {
    time: string;
    available: boolean;
    bookedCount: number;
    maxBookings: number;
  }[];
}

export interface GuardianSpiritsResponse {
  spirits: GuardianSpirit[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Promotion {
  id: string;
  nameKey: string;
  descriptionKey?: string;
  code?: string;
  type: string;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  perUserLimit: number;
  isActive: boolean;
  applicablePlans?: string;
  metadata?: string;
  usedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionsResponse {
  promotions: Promotion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnalyticsEventRequest {
  eventName: string;
  eventType: string;
  userId?: string;
  deviceId: string;
  sessionId?: string;
  screenName?: string;
  screenPath?: string;
  screenParams?: string;
  elementId?: string;
  elementType?: string;
  eventData?: string;
  platform?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  timezone?: string;
  locale?: string;
  occurredAt?: string;
  durationMs?: number;
  success?: boolean;
  errorType?: string;
  isAnonymous?: boolean;
}

export interface AnalyticsSessionRequest {
  userId?: string;
  deviceId: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  screensVisited?: string;
}

export interface AnalyticsProfileRequest {
  userId: string;
  deviceId?: string;
  lastVisitAt?: string;
  totalVisits?: number;
  totalSessions?: number;
  totalTimeMs?: number;
  preferredLanguage?: string;
  preferredTheme?: string;
  signupStep?: number;
  onboardingComplete?: boolean;
  featuresUsed?: string;
}

export interface AnalyticsFeatureUsageRequest {
  userId: string;
  featureKey: string;
  count?: number;
  lastUsedAt?: string;
  totalDurationMs?: number;
}

export interface AnalyticsErrorRequest {
  errorType: string;
  message: string;
  stackTrace?: string;
  userId?: string;
  deviceId?: string;
  screenName?: string;
  occurredAt?: string;
}

export interface AnalyticsUserProfile {
  id: string;
  userId: string;
  deviceId?: string;
  lastVisitAt: string;
  totalVisits: number;
  totalSessions: number;
  totalTimeMs: number;
  preferredLanguage?: string;
  preferredTheme?: string;
  signupStep: number;
  onboardingComplete: boolean;
  featuresUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsFeatureUsage {
  id: string;
  userId: string;
  featureKey: string;
  count: number;
  lastUsedAt: string;
  totalDurationMs: number;
}

// ==============================================
// 👤 匿名用户管理类型定义
// ==============================================

export interface AnonymousUser {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  deviceId?: string;
  lastActiveAt?: Date;
}

export interface AnonymousGenerateResponse {
  success: boolean;
  data: {
    anonymousId: string;
    expiresAt: string;
  };
  message: string;
}

export interface AnonymousValidateResponse {
  success: boolean;
  data: {
    isValid: boolean;
    isNotExpired: boolean;
    isValidAndActive: boolean;
  };
}

export interface AnonymousStatsResponse {
  success: boolean;
  data: {
    playHistory: number;
    favorites: number;
    checkIns: number;
    lessonProgress: number;
  };
}

export interface AnonymousMigrationResponse {
  success: boolean;
  data: {
    playHistory: number;
    favorites: number;
    checkIns: number;
    lessonProgress: number;
    shares: number;
  };
  message: string;
}

export const apiService = new ApiService();
