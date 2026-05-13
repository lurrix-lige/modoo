-- AlterTable
ALTER TABLE "dialogues" ADD COLUMN "response" TEXT;
ALTER TABLE "dialogues" ADD COLUMN "scenario" TEXT;
ALTER TABLE "dialogues" ADD COLUMN "title" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "description" TEXT;

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
    "publishDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tagsJson" TEXT,
    "author" TEXT,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_articles" ("category", "content", "coverUrl", "createdAt", "id", "publishedAt", "readTime", "summary", "title", "updatedAt", "views") SELECT "category", "content", "coverUrl", "createdAt", "id", "publishedAt", "readTime", "summary", "title", "updatedAt", "views" FROM "articles";
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_breathing_exercises" ("color", "createdAt", "descriptionKey", "difficulty", "icon", "id", "nameKey", "phasesJson") SELECT "color", "createdAt", "descriptionKey", "difficulty", "icon", "id", "nameKey", "phasesJson" FROM "breathing_exercises";
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_courses" ("createdAt", "description", "difficulty", "id", "imageUrl", "isUnlocked", "level", "name", "totalLessons", "updatedAt") SELECT "createdAt", "description", "difficulty", "id", "imageUrl", "isUnlocked", "level", "name", "totalLessons", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE TABLE "new_stories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_stories" ("audioUrl", "category", "coverUrl", "createdAt", "description", "duration", "id", "title", "updatedAt") SELECT "audioUrl", "category", "coverUrl", "createdAt", "description", "duration", "id", "title", "updatedAt" FROM "stories";
DROP TABLE "stories";
ALTER TABLE "new_stories" RENAME TO "stories";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
