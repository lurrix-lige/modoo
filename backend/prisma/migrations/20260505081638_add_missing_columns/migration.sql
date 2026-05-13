-- AlterTable
ALTER TABLE "dialogues" ADD COLUMN "response" TEXT;
ALTER TABLE "dialogues" ADD COLUMN "scenario" TEXT;
ALTER TABLE "dialogues" ADD COLUMN "title" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "categoryKey" TEXT,
    "category" TEXT NOT NULL,
    "coverUrl" TEXT,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
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
INSERT INTO "new_articles" ("accessTier", "author", "category", "content", "coverUrl", "createdAt", "deletedAt", "id", "isPremium", "likes", "publishDate", "publishedAt", "readTime", "summary", "tagsJson", "title", "updatedAt", "views") SELECT "accessTier", "author", "category", "content", "coverUrl", "createdAt", "deletedAt", "id", "isPremium", "likes", "publishDate", "publishedAt", "readTime", "summary", "tagsJson", "title", "updatedAt", "views" FROM "articles";
DROP TABLE "articles";
ALTER TABLE "new_articles" RENAME TO "articles";
CREATE INDEX "articles_category_idx" ON "articles"("category");
CREATE INDEX "articles_isPremium_idx" ON "articles"("isPremium");
CREATE INDEX "articles_accessTier_idx" ON "articles"("accessTier");
CREATE INDEX "articles_publishedAt_idx" ON "articles"("publishedAt");
CREATE INDEX "articles_deletedAt_idx" ON "articles"("deletedAt");
CREATE TABLE "new_favorites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
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
INSERT INTO "new_favorites" ("articleId", "childId", "createdAt", "id", "storyId", "type", "updatedAt", "userId") SELECT "articleId", "childId", "createdAt", "id", "storyId", "type", "updatedAt", "userId" FROM "favorites";
DROP TABLE "favorites";
ALTER TABLE "new_favorites" RENAME TO "favorites";
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");
CREATE INDEX "favorites_childId_idx" ON "favorites"("childId");
CREATE UNIQUE INDEX "favorites_childId_storyId_key" ON "favorites"("childId", "storyId");
CREATE UNIQUE INDEX "favorites_childId_articleId_key" ON "favorites"("childId", "articleId");
CREATE UNIQUE INDEX "favorites_childId_dialogueId_key" ON "favorites"("childId", "dialogueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
