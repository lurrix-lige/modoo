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
    createdAt?: string;
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

export interface AnonymousUser {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  deviceId?: string;
  lastActiveAt?: Date;
}

export interface AnonymousGenerateResponse {
  anonymousId: string;
  expiresAt: string;
}

export interface AnonymousValidateResponse {
  isValid: boolean;
  isNotExpired: boolean;
  isValidAndActive: boolean;
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
