/*
  Warnings:

  - You are about to drop the column `guardianIP` on the `children` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `experts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "verification_codes_phone_code_idx";

-- AlterTable
ALTER TABLE "articles" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "i18n_resources" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "stories" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "deletedAt" DATETIME;

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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_children" (
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
INSERT INTO "new_children" ("birthday", "createdAt", "gender", "id", "nickname", "sleepProblems", "updatedAt", "userId") SELECT "birthday", "createdAt", "gender", "id", "nickname", "sleepProblems", "updatedAt", "userId" FROM "children";
DROP TABLE "children";
ALTER TABLE "new_children" RENAME TO "children";
CREATE UNIQUE INDEX "children_userId_key" ON "children"("userId");
CREATE INDEX "children_userId_idx" ON "children"("userId");
CREATE INDEX "children_guardianSpiritId_idx" ON "children"("guardianSpiritId");
CREATE INDEX "children_deletedAt_idx" ON "children"("deletedAt");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_experts" ("accessTier", "availableTimesJson", "avatarUrl", "consultationLimit", "consultationPrice", "createdAt", "experience", "hospitalKey", "id", "nameKey", "rating", "reviewCount", "specialtyKeysJson", "titleKey") SELECT "accessTier", "availableTimesJson", "avatarUrl", "consultationLimit", "consultationPrice", "createdAt", "experience", "hospitalKey", "id", "nameKey", "rating", "reviewCount", "specialtyKeysJson", "titleKey" FROM "experts";
DROP TABLE "experts";
ALTER TABLE "new_experts" RENAME TO "experts";
CREATE INDEX "experts_accessTier_idx" ON "experts"("accessTier");
CREATE INDEX "experts_rating_idx" ON "experts"("rating");
CREATE INDEX "experts_deletedAt_idx" ON "experts"("deletedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "guardian_spirits_type_idx" ON "guardian_spirits"("type");

-- CreateIndex
CREATE INDEX "guardian_spirits_isDefault_idx" ON "guardian_spirits"("isDefault");

-- CreateIndex
CREATE INDEX "guardian_spirits_isActive_idx" ON "guardian_spirits"("isActive");

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
CREATE INDEX "benefits_type_idx" ON "benefits"("type");

-- CreateIndex
CREATE INDEX "benefits_scope_idx" ON "benefits"("scope");

-- CreateIndex
CREATE INDEX "benefits_isActive_idx" ON "benefits"("isActive");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_date_idx" ON "bookings"("date");

-- CreateIndex
CREATE INDEX "breathing_exercises_difficulty_idx" ON "breathing_exercises"("difficulty");

-- CreateIndex
CREATE INDEX "breathing_exercises_isPremium_idx" ON "breathing_exercises"("isPremium");

-- CreateIndex
CREATE INDEX "breathing_exercises_accessTier_idx" ON "breathing_exercises"("accessTier");

-- CreateIndex
CREATE INDEX "courses_difficulty_idx" ON "courses"("difficulty");

-- CreateIndex
CREATE INDEX "courses_isPremium_idx" ON "courses"("isPremium");

-- CreateIndex
CREATE INDEX "courses_accessTier_idx" ON "courses"("accessTier");

-- CreateIndex
CREATE INDEX "courses_deletedAt_idx" ON "courses"("deletedAt");

-- CreateIndex
CREATE INDEX "dialogues_category_idx" ON "dialogues"("category");

-- CreateIndex
CREATE INDEX "dialogues_isPremium_idx" ON "dialogues"("isPremium");

-- CreateIndex
CREATE INDEX "dialogues_accessTier_idx" ON "dialogues"("accessTier");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "pricing_plans_sortOrder_idx" ON "pricing_plans"("sortOrder");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "stories_category_idx" ON "stories"("category");

-- CreateIndex
CREATE INDEX "stories_isPremium_idx" ON "stories"("isPremium");

-- CreateIndex
CREATE INDEX "stories_accessTier_idx" ON "stories"("accessTier");

-- CreateIndex
CREATE INDEX "stories_deletedAt_idx" ON "stories"("deletedAt");

-- CreateIndex
CREATE INDEX "subscriptions_currentPeriodEnd_idx" ON "subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "verification_codes_phone_idx" ON "verification_codes"("phone");

-- CreateIndex
CREATE INDEX "verification_codes_expiresAt_idx" ON "verification_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "white_noises_accessTier_idx" ON "white_noises"("accessTier");
