/*
  Warnings:

  - A unique constraint covering the columns `[appleUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wechatOpenid]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `white_noises` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "appleEmail" TEXT;
ALTER TABLE "users" ADD COLUMN "appleUserId" TEXT;
ALTER TABLE "users" ADD COLUMN "wechatOpenid" TEXT;
ALTER TABLE "users" ADD COLUMN "wechatUnionid" TEXT;

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
    "validFrom" DATETIME,
    "validTo" DATETIME,
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "coverUrl" TEXT,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "readTime" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "publishDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tagsJson" TEXT,
    "author" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_articles" ("author", "category", "content", "coverUrl", "createdAt", "id", "isPremium", "likes", "publishDate", "publishedAt", "readTime", "summary", "tagsJson", "title", "updatedAt", "views") SELECT "author", "category", "content", "coverUrl", "createdAt", "id", "isPremium", "likes", "publishDate", "publishedAt", "readTime", "summary", "tagsJson", "title", "updatedAt", "views" FROM "articles";
DROP TABLE "articles";
ALTER TABLE "new_articles" RENAME TO "articles";
CREATE TABLE "new_breathing_exercises" (
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
INSERT INTO "new_breathing_exercises" ("color", "createdAt", "descriptionKey", "difficulty", "icon", "id", "isPremium", "nameKey", "phasesJson") SELECT "color", "createdAt", "descriptionKey", "difficulty", "icon", "id", "isPremium", "nameKey", "phasesJson" FROM "breathing_exercises";
DROP TABLE "breathing_exercises";
ALTER TABLE "new_breathing_exercises" RENAME TO "breathing_exercises";
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_courses" ("completedLessons", "createdAt", "description", "difficulty", "estimatedDuration", "id", "imageUrl", "isPremium", "isUnlocked", "level", "name", "totalLessons", "updatedAt") SELECT "completedLessons", "createdAt", "description", "difficulty", "estimatedDuration", "id", "imageUrl", "isPremium", "isUnlocked", "level", "name", "totalLessons", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE TABLE "new_dialogues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleKey" TEXT NOT NULL,
    "scenarioKey" TEXT,
    "responseKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_dialogues" ("category", "createdAt", "id", "isPremium", "responseKey", "scenarioKey", "tagsJson", "titleKey", "useCount") SELECT "category", "createdAt", "id", "isPremium", "responseKey", "scenarioKey", "tagsJson", "titleKey", "useCount" FROM "dialogues";
DROP TABLE "dialogues";
ALTER TABLE "new_dialogues" RENAME TO "dialogues";
CREATE TABLE "new_experts" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_experts" ("availableTimesJson", "avatarUrl", "consultationPrice", "createdAt", "experience", "hospitalKey", "id", "nameKey", "rating", "reviewCount", "specialtyKeysJson", "titleKey") SELECT "availableTimesJson", "avatarUrl", "consultationPrice", "createdAt", "experience", "hospitalKey", "id", "nameKey", "rating", "reviewCount", "specialtyKeysJson", "titleKey" FROM "experts";
DROP TABLE "experts";
ALTER TABLE "new_experts" RENAME TO "experts";
CREATE TABLE "new_stories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "accessTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "previewContent" TEXT,
    "previewDuration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_stories" ("audioUrl", "category", "coverUrl", "createdAt", "description", "duration", "id", "isPremium", "title", "updatedAt") SELECT "audioUrl", "category", "coverUrl", "createdAt", "description", "duration", "id", "isPremium", "title", "updatedAt" FROM "stories";
DROP TABLE "stories";
ALTER TABLE "new_stories" RENAME TO "stories";
CREATE TABLE "new_white_noises" (
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
INSERT INTO "new_white_noises" ("audioUrl", "category", "color", "createdAt", "duration", "icon", "id", "isLoopable", "isPremium", "nameKey") SELECT "audioUrl", "category", "color", "createdAt", "duration", "icon", "id", coalesce("isLoopable", true) AS "isLoopable", "isPremium", "nameKey" FROM "white_noises";
DROP TABLE "white_noises";
ALTER TABLE "new_white_noises" RENAME TO "white_noises";
CREATE INDEX "white_noises_category_idx" ON "white_noises"("category");
CREATE INDEX "white_noises_isPremium_idx" ON "white_noises"("isPremium");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_planKey_key" ON "pricing_plans"("planKey");

-- CreateIndex
CREATE INDEX "pricing_plans_isActive_idx" ON "pricing_plans"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "benefits_benefitKey_key" ON "benefits"("benefitKey");

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
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_code_idx" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_isActive_startDate_endDate_idx" ON "promotions"("isActive", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleUserId_key" ON "users"("appleUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_wechatOpenid_key" ON "users"("wechatOpenid");
