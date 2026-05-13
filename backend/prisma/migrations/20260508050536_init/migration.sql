-- AlterTable
ALTER TABLE "stories" ADD COLUMN "descriptionKey" TEXT;
ALTER TABLE "stories" ADD COLUMN "titleKey" TEXT;

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
