/*
  Warnings:

  - You are about to drop the column `categoryKey` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `dialogues` table. All the data in the column will be lost.
  - You are about to drop the column `scenario` on the `dialogues` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `dialogues` table. All the data in the column will be lost.

*/
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
CREATE TABLE "new_dialogues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleKey" TEXT NOT NULL,
    "scenarioKey" TEXT,
    "responseKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_dialogues" ("category", "createdAt", "id", "isPremium", "responseKey", "scenarioKey", "tagsJson", "titleKey", "useCount") SELECT "category", "createdAt", "id", "isPremium", "responseKey", "scenarioKey", "tagsJson", "titleKey", "useCount" FROM "dialogues";
DROP TABLE "dialogues";
ALTER TABLE "new_dialogues" RENAME TO "dialogues";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "i18n_resources_language_idx" ON "i18n_resources"("language");

-- CreateIndex
CREATE INDEX "i18n_resources_status_idx" ON "i18n_resources"("status");

-- CreateIndex
CREATE INDEX "i18n_resources_lastPublished_idx" ON "i18n_resources"("lastPublished");

-- CreateIndex
CREATE UNIQUE INDEX "i18n_resources_resourceKey_language_key" ON "i18n_resources"("resourceKey", "language");

-- CreateIndex
CREATE INDEX "check_ins_userId_date_idx" ON "check_ins"("userId", "date");
