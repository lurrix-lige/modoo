-- CreateTable
CREATE TABLE "i18n_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resourceKey" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "author" TEXT,
    "notes" TEXT,
    "lastPublished" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "appleUserId" TEXT,
    "appleEmail" TEXT,
    "wechatOpenid" TEXT,
    "wechatUnionid" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "children" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "birthday" DATETIME NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'MALE',
    "avatarUrl" TEXT,
    "guardianSpiritId" TEXT,
    "sleepProblems" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "children_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_guardianSpiritId_fkey" FOREIGN KEY ("guardianSpiritId") REFERENCES "guardian_spirits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "guardian_spirits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKey" TEXT NOT NULL,
    "descriptionKey" TEXT,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MOON',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleKey" TEXT,
    "coverUrl" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "descriptionKey" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "previewContent" TEXT,
    "previewDuration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "childId" TEXT,
    "anonymousId" TEXT,
    "date" TEXT NOT NULL,
    "sleepTime" TEXT NOT NULL,
    "wakeTime" TEXT NOT NULL,
    "quality" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "check_ins_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "play_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "childId" TEXT,
    "anonymousId" TEXT,
    "storyId" TEXT NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastPlayedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "play_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "play_history_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "play_history_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planKey" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "descriptionKey" TEXT,
    "originalPrice" REAL NOT NULL,
    "currentPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "durationDays" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "savingPercent" INTEGER,
    "features" TEXT,
    "notIncluded" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "benefits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benefitKey" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "descriptionKey" TEXT,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ALL_USERS',
    "value" TEXT,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "product_benefits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benefitId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productId" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'FULL',
    "limitQuantity" INTEGER,
    "limitPeriod" TEXT,
    "isGrantByDefault" BOOLEAN NOT NULL DEFAULT true,
    "conditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_benefits_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "benefits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "terminationReason" TEXT,
    "externalSubId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pricing_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription_benefits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "usageLimit" INTEGER,
    "usagePeriod" TEXT,
    "lastUsedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subscription_benefits_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subscription_benefits_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "benefits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "subscriptionId" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "gatewayResponse" TEXT,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_transactions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalAmount" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "finalAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "paymentMethod" TEXT,
    "paymentChannel" TEXT,
    "transactionId" TEXT,
    "paidAt" DATETIME,
    "expiredAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "cancelReason" TEXT,
    "refundAmount" REAL,
    "refundedAt" DATETIME,
    "refundReason" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "finalPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pricing_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKey" TEXT NOT NULL,
    "descriptionKey" TEXT,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "minPurchase" REAL,
    "maxDiscount" REAL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicablePlans" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleKey" TEXT,
    "categoryKey" TEXT,
    "category" TEXT NOT NULL,
    "coverUrl" TEXT,
    "content" TEXT NOT NULL,
    "contentKey" TEXT,
    "summary" TEXT NOT NULL,
    "summaryKey" TEXT,
    "readTime" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isFavorited" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "publishDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tagsJson" TEXT,
    "author" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "childId" TEXT,
    "anonymousId" TEXT,
    "storyId" TEXT,
    "articleId" TEXT,
    "dialogueId" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_dialogueId_fkey" FOREIGN KEY ("dialogueId") REFERENCES "dialogues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "childId" TEXT,
    "anonymousId" TEXT,
    "storyId" TEXT,
    "articleId" TEXT,
    "type" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shares_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shares_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shares_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT,
    "description" TEXT NOT NULL,
    "descriptionKey" TEXT,
    "imageUrl" TEXT NOT NULL,
    "totalLessons" INTEGER NOT NULL,
    "completedLessons" INTEGER NOT NULL DEFAULT 0,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT true,
    "estimatedDuration" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "previewLessons" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleKey" TEXT,
    "description" TEXT,
    "descriptionKey" TEXT,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "childId" TEXT,
    "anonymousId" TEXT,
    "lessonId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lesson_progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "breathing_exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKey" TEXT NOT NULL,
    "descriptionKey" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "phasesJson" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "previewDuration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "white_noises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKey" TEXT NOT NULL,
    "name" TEXT,
    "category" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "duration" INTEGER,
    "isLoopable" BOOLEAN NOT NULL DEFAULT true,
    "previewDuration" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "dialogues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleKey" TEXT NOT NULL,
    "scenarioKey" TEXT,
    "responseKey" TEXT NOT NULL,
    "title" TEXT,
    "scenario" TEXT,
    "response" TEXT,
    "category" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "experts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameKey" TEXT NOT NULL,
    "titleKey" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "hospitalKey" TEXT NOT NULL,
    "specialtyKeysJson" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "consultationPrice" INTEGER NOT NULL,
    "rating" REAL NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "availableTimesJson" TEXT,
    "accessTier" TEXT NOT NULL DEFAULT 'PREMIUM',
    "consultationLimit" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "experts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sleepReminder" BOOLEAN NOT NULL DEFAULT true,
    "checkInReminder" BOOLEAN NOT NULL DEFAULT true,
    "reportNotification" BOOLEAN NOT NULL DEFAULT true,
    "expertReminder" BOOLEAN NOT NULL DEFAULT false,
    "activityReminder" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "privacy_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dataCollection" BOOLEAN NOT NULL DEFAULT true,
    "analytics" BOOLEAN NOT NULL DEFAULT true,
    "personalizedRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "privacy_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT NOT NULL,
    "sessionId" TEXT,
    "screenName" TEXT,
    "screenPath" TEXT,
    "screenParams" TEXT,
    "elementId" TEXT,
    "elementType" TEXT,
    "eventData" TEXT,
    "platform" TEXT,
    "deviceModel" TEXT,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "timezone" TEXT,
    "locale" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "success" BOOLEAN,
    "errorType" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "batchId" TEXT,
    CONSTRAINT "analytics_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "analytics_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "analytics_events_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "analytics_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "deviceId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "durationMs" INTEGER,
    "screensVisited" TEXT
);

-- CreateTable
CREATE TABLE "analytics_user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "firstVisitAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitAt" DATETIME NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 1,
    "totalSessions" INTEGER NOT NULL DEFAULT 1,
    "totalTimeMs" INTEGER NOT NULL DEFAULT 0,
    "preferredLanguage" TEXT,
    "preferredTheme" TEXT,
    "signupStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "featuresUsed" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "analytics_feature_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" DATETIME NOT NULL,
    "totalDurationMs" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "analytics_errors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "errorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stackTrace" TEXT,
    "userId" TEXT,
    "deviceId" TEXT,
    "screenName" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "analytics_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "firstEventAt" DATETIME NOT NULL,
    "lastEventAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME
);

-- CreateIndex
CREATE INDEX "i18n_resources_language_idx" ON "i18n_resources"("language");

-- CreateIndex
CREATE INDEX "i18n_resources_status_idx" ON "i18n_resources"("status");

-- CreateIndex
CREATE INDEX "i18n_resources_lastPublished_idx" ON "i18n_resources"("lastPublished");

-- CreateIndex
CREATE UNIQUE INDEX "i18n_resources_resourceKey_language_key" ON "i18n_resources"("resourceKey", "language");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleUserId_key" ON "users"("appleUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_wechatOpenid_key" ON "users"("wechatOpenid");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "children_userId_key" ON "children"("userId");

-- CreateIndex
CREATE INDEX "children_userId_idx" ON "children"("userId");

-- CreateIndex
CREATE INDEX "children_guardianSpiritId_idx" ON "children"("guardianSpiritId");

-- CreateIndex
CREATE INDEX "children_deletedAt_idx" ON "children"("deletedAt");

-- CreateIndex
CREATE INDEX "guardian_spirits_type_idx" ON "guardian_spirits"("type");

-- CreateIndex
CREATE INDEX "guardian_spirits_isDefault_idx" ON "guardian_spirits"("isDefault");

-- CreateIndex
CREATE INDEX "guardian_spirits_isActive_idx" ON "guardian_spirits"("isActive");

-- CreateIndex
CREATE INDEX "stories_category_idx" ON "stories"("category");

-- CreateIndex
CREATE INDEX "stories_isPremium_idx" ON "stories"("isPremium");

-- CreateIndex
CREATE INDEX "stories_accessTier_idx" ON "stories"("accessTier");

-- CreateIndex
CREATE INDEX "stories_deletedAt_idx" ON "stories"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "check_ins_userId_date_idx" ON "check_ins"("userId", "date");

-- CreateIndex
CREATE INDEX "check_ins_userId_idx" ON "check_ins"("userId");

-- CreateIndex
CREATE INDEX "check_ins_childId_idx" ON "check_ins"("childId");

-- CreateIndex
CREATE INDEX "check_ins_anonymousId_idx" ON "check_ins"("anonymousId");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_childId_date_key" ON "check_ins"("childId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_anonymousId_date_key" ON "check_ins"("anonymousId", "date");

-- CreateIndex
CREATE INDEX "play_history_userId_idx" ON "play_history"("userId");

-- CreateIndex
CREATE INDEX "play_history_childId_idx" ON "play_history"("childId");

-- CreateIndex
CREATE INDEX "play_history_anonymousId_idx" ON "play_history"("anonymousId");

-- CreateIndex
CREATE UNIQUE INDEX "play_history_childId_storyId_key" ON "play_history"("childId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "play_history_anonymousId_storyId_key" ON "play_history"("anonymousId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_planKey_key" ON "pricing_plans"("planKey");

-- CreateIndex
CREATE INDEX "pricing_plans_isActive_idx" ON "pricing_plans"("isActive");

-- CreateIndex
CREATE INDEX "pricing_plans_sortOrder_idx" ON "pricing_plans"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "benefits_benefitKey_key" ON "benefits"("benefitKey");

-- CreateIndex
CREATE INDEX "benefits_type_idx" ON "benefits"("type");

-- CreateIndex
CREATE INDEX "benefits_scope_idx" ON "benefits"("scope");

-- CreateIndex
CREATE INDEX "benefits_isActive_idx" ON "benefits"("isActive");

-- CreateIndex
CREATE INDEX "product_benefits_productType_productId_idx" ON "product_benefits"("productType", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_benefits_benefitId_productType_productId_key" ON "product_benefits"("benefitId", "productType", "productId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_externalSubId_idx" ON "subscriptions"("externalSubId");

-- CreateIndex
CREATE INDEX "subscriptions_currentPeriodEnd_idx" ON "subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "subscription_benefits_subscriptionId_idx" ON "subscription_benefits"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_benefits_subscriptionId_benefitId_key" ON "subscription_benefits"("subscriptionId", "benefitId");

-- CreateIndex
CREATE INDEX "payment_transactions_orderId_idx" ON "payment_transactions"("orderId");

-- CreateIndex
CREATE INDEX "payment_transactions_subscriptionId_idx" ON "payment_transactions"("subscriptionId");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");

-- CreateIndex
CREATE INDEX "payment_transactions_transactionId_idx" ON "payment_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNo_key" ON "orders"("orderNo");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_subscriptionId_idx" ON "orders"("subscriptionId");

-- CreateIndex
CREATE INDEX "orders_orderNo_idx" ON "orders"("orderNo");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_code_idx" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_isActive_startDate_endDate_idx" ON "promotions"("isActive", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "articles_category_idx" ON "articles"("category");

-- CreateIndex
CREATE INDEX "articles_isPremium_idx" ON "articles"("isPremium");

-- CreateIndex
CREATE INDEX "articles_accessTier_idx" ON "articles"("accessTier");

-- CreateIndex
CREATE INDEX "articles_publishedAt_idx" ON "articles"("publishedAt");

-- CreateIndex
CREATE INDEX "articles_deletedAt_idx" ON "articles"("deletedAt");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_childId_idx" ON "favorites"("childId");

-- CreateIndex
CREATE INDEX "favorites_anonymousId_idx" ON "favorites"("anonymousId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_childId_storyId_key" ON "favorites"("childId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_childId_articleId_key" ON "favorites"("childId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_childId_dialogueId_key" ON "favorites"("childId", "dialogueId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_anonymousId_storyId_key" ON "favorites"("anonymousId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_anonymousId_articleId_key" ON "favorites"("anonymousId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_anonymousId_dialogueId_key" ON "favorites"("anonymousId", "dialogueId");

-- CreateIndex
CREATE INDEX "shares_userId_idx" ON "shares"("userId");

-- CreateIndex
CREATE INDEX "shares_childId_idx" ON "shares"("childId");

-- CreateIndex
CREATE INDEX "shares_anonymousId_idx" ON "shares"("anonymousId");

-- CreateIndex
CREATE UNIQUE INDEX "shares_childId_storyId_key" ON "shares"("childId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "shares_childId_articleId_key" ON "shares"("childId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "shares_anonymousId_storyId_key" ON "shares"("anonymousId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "shares_anonymousId_articleId_key" ON "shares"("anonymousId", "articleId");

-- CreateIndex
CREATE INDEX "verification_codes_phone_idx" ON "verification_codes"("phone");

-- CreateIndex
CREATE INDEX "verification_codes_expiresAt_idx" ON "verification_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "courses_difficulty_idx" ON "courses"("difficulty");

-- CreateIndex
CREATE INDEX "courses_isPremium_idx" ON "courses"("isPremium");

-- CreateIndex
CREATE INDEX "courses_accessTier_idx" ON "courses"("accessTier");

-- CreateIndex
CREATE INDEX "courses_deletedAt_idx" ON "courses"("deletedAt");

-- CreateIndex
CREATE INDEX "lessons_courseId_idx" ON "lessons"("courseId");

-- CreateIndex
CREATE INDEX "lesson_progress_userId_idx" ON "lesson_progress"("userId");

-- CreateIndex
CREATE INDEX "lesson_progress_childId_idx" ON "lesson_progress"("childId");

-- CreateIndex
CREATE INDEX "lesson_progress_anonymousId_idx" ON "lesson_progress"("anonymousId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_childId_lessonId_key" ON "lesson_progress"("childId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_anonymousId_lessonId_key" ON "lesson_progress"("anonymousId", "lessonId");

-- CreateIndex
CREATE INDEX "breathing_exercises_difficulty_idx" ON "breathing_exercises"("difficulty");

-- CreateIndex
CREATE INDEX "breathing_exercises_isPremium_idx" ON "breathing_exercises"("isPremium");

-- CreateIndex
CREATE INDEX "breathing_exercises_accessTier_idx" ON "breathing_exercises"("accessTier");

-- CreateIndex
CREATE INDEX "white_noises_category_idx" ON "white_noises"("category");

-- CreateIndex
CREATE INDEX "white_noises_isPremium_idx" ON "white_noises"("isPremium");

-- CreateIndex
CREATE INDEX "white_noises_accessTier_idx" ON "white_noises"("accessTier");

-- CreateIndex
CREATE INDEX "dialogues_category_idx" ON "dialogues"("category");

-- CreateIndex
CREATE INDEX "dialogues_isPremium_idx" ON "dialogues"("isPremium");

-- CreateIndex
CREATE INDEX "dialogues_accessTier_idx" ON "dialogues"("accessTier");

-- CreateIndex
CREATE INDEX "experts_accessTier_idx" ON "experts"("accessTier");

-- CreateIndex
CREATE INDEX "experts_rating_idx" ON "experts"("rating");

-- CreateIndex
CREATE INDEX "experts_deletedAt_idx" ON "experts"("deletedAt");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_expertId_idx" ON "bookings"("expertId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_date_idx" ON "bookings"("date");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_settings_userId_key" ON "privacy_settings"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_eventName_idx" ON "analytics_events"("eventName");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_deviceId_idx" ON "analytics_events"("deviceId");

-- CreateIndex
CREATE INDEX "analytics_events_occurredAt_idx" ON "analytics_events"("occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_screenName_idx" ON "analytics_events"("screenName");

-- CreateIndex
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_events_batchId_idx" ON "analytics_events"("batchId");

-- CreateIndex
CREATE INDEX "analytics_sessions_userId_idx" ON "analytics_sessions"("userId");

-- CreateIndex
CREATE INDEX "analytics_sessions_deviceId_idx" ON "analytics_sessions"("deviceId");

-- CreateIndex
CREATE INDEX "analytics_sessions_startTime_idx" ON "analytics_sessions"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_user_profiles_userId_key" ON "analytics_user_profiles"("userId");

-- CreateIndex
CREATE INDEX "analytics_user_profiles_userId_idx" ON "analytics_user_profiles"("userId");

-- CreateIndex
CREATE INDEX "analytics_feature_usage_userId_idx" ON "analytics_feature_usage"("userId");

-- CreateIndex
CREATE INDEX "analytics_feature_usage_featureKey_idx" ON "analytics_feature_usage"("featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_feature_usage_userId_featureKey_key" ON "analytics_feature_usage"("userId", "featureKey");

-- CreateIndex
CREATE INDEX "analytics_errors_errorType_idx" ON "analytics_errors"("errorType");

-- CreateIndex
CREATE INDEX "analytics_errors_userId_idx" ON "analytics_errors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_batches_batchId_key" ON "analytics_batches"("batchId");

-- CreateIndex
CREATE INDEX "analytics_batches_batchId_idx" ON "analytics_batches"("batchId");

-- CreateIndex
CREATE INDEX "analytics_batches_deviceId_idx" ON "analytics_batches"("deviceId");

-- CreateIndex
CREATE INDEX "analytics_batches_status_idx" ON "analytics_batches"("status");
