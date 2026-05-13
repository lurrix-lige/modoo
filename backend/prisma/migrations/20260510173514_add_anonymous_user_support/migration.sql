-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_check_ins" (
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
INSERT INTO "new_check_ins" ("childId", "createdAt", "date", "id", "quality", "sleepTime", "updatedAt", "userId", "wakeTime") SELECT "childId", "createdAt", "date", "id", "quality", "sleepTime", "updatedAt", "userId", "wakeTime" FROM "check_ins";
DROP TABLE "check_ins";
ALTER TABLE "new_check_ins" RENAME TO "check_ins";
CREATE INDEX "check_ins_userId_date_idx" ON "check_ins"("userId", "date");
CREATE INDEX "check_ins_userId_idx" ON "check_ins"("userId");
CREATE INDEX "check_ins_childId_idx" ON "check_ins"("childId");
CREATE INDEX "check_ins_anonymousId_idx" ON "check_ins"("anonymousId");
CREATE UNIQUE INDEX "check_ins_childId_date_key" ON "check_ins"("childId", "date");
CREATE TABLE "new_favorites" (
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
INSERT INTO "new_favorites" ("articleId", "childId", "createdAt", "dialogueId", "id", "storyId", "type", "updatedAt", "userId") SELECT "articleId", "childId", "createdAt", "dialogueId", "id", "storyId", "type", "updatedAt", "userId" FROM "favorites";
DROP TABLE "favorites";
ALTER TABLE "new_favorites" RENAME TO "favorites";
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");
CREATE INDEX "favorites_childId_idx" ON "favorites"("childId");
CREATE INDEX "favorites_anonymousId_idx" ON "favorites"("anonymousId");
CREATE UNIQUE INDEX "favorites_childId_storyId_key" ON "favorites"("childId", "storyId");
CREATE UNIQUE INDEX "favorites_childId_articleId_key" ON "favorites"("childId", "articleId");
CREATE UNIQUE INDEX "favorites_childId_dialogueId_key" ON "favorites"("childId", "dialogueId");
CREATE UNIQUE INDEX "favorites_anonymousId_storyId_key" ON "favorites"("anonymousId", "storyId");
CREATE UNIQUE INDEX "favorites_anonymousId_articleId_key" ON "favorites"("anonymousId", "articleId");
CREATE UNIQUE INDEX "favorites_anonymousId_dialogueId_key" ON "favorites"("anonymousId", "dialogueId");
CREATE TABLE "new_lesson_progress" (
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
INSERT INTO "new_lesson_progress" ("childId", "completedAt", "createdAt", "id", "isCompleted", "lessonId", "updatedAt", "userId") SELECT "childId", "completedAt", "createdAt", "id", "isCompleted", "lessonId", "updatedAt", "userId" FROM "lesson_progress";
DROP TABLE "lesson_progress";
ALTER TABLE "new_lesson_progress" RENAME TO "lesson_progress";
CREATE INDEX "lesson_progress_userId_idx" ON "lesson_progress"("userId");
CREATE INDEX "lesson_progress_childId_idx" ON "lesson_progress"("childId");
CREATE INDEX "lesson_progress_anonymousId_idx" ON "lesson_progress"("anonymousId");
CREATE UNIQUE INDEX "lesson_progress_childId_lessonId_key" ON "lesson_progress"("childId", "lessonId");
CREATE UNIQUE INDEX "lesson_progress_anonymousId_lessonId_key" ON "lesson_progress"("anonymousId", "lessonId");
CREATE TABLE "new_play_history" (
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
INSERT INTO "new_play_history" ("childId", "completed", "createdAt", "id", "lastPlayedAt", "progress", "storyId", "updatedAt", "userId") SELECT "childId", "completed", "createdAt", "id", "lastPlayedAt", "progress", "storyId", "updatedAt", "userId" FROM "play_history";
DROP TABLE "play_history";
ALTER TABLE "new_play_history" RENAME TO "play_history";
CREATE INDEX "play_history_userId_idx" ON "play_history"("userId");
CREATE INDEX "play_history_childId_idx" ON "play_history"("childId");
CREATE INDEX "play_history_anonymousId_idx" ON "play_history"("anonymousId");
CREATE UNIQUE INDEX "play_history_childId_storyId_key" ON "play_history"("childId", "storyId");
CREATE UNIQUE INDEX "play_history_anonymousId_storyId_key" ON "play_history"("anonymousId", "storyId");
CREATE TABLE "new_shares" (
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
INSERT INTO "new_shares" ("articleId", "childId", "createdAt", "id", "platform", "storyId", "type", "updatedAt", "userId") SELECT "articleId", "childId", "createdAt", "id", "platform", "storyId", "type", "updatedAt", "userId" FROM "shares";
DROP TABLE "shares";
ALTER TABLE "new_shares" RENAME TO "shares";
CREATE INDEX "shares_userId_idx" ON "shares"("userId");
CREATE INDEX "shares_childId_idx" ON "shares"("childId");
CREATE INDEX "shares_anonymousId_idx" ON "shares"("anonymousId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
