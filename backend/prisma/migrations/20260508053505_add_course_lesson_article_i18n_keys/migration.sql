-- AlterTable
ALTER TABLE "articles" ADD COLUMN "contentKey" TEXT;
ALTER TABLE "articles" ADD COLUMN "summaryKey" TEXT;
ALTER TABLE "articles" ADD COLUMN "titleKey" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "descriptionKey" TEXT;
ALTER TABLE "courses" ADD COLUMN "nameKey" TEXT;

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "descriptionKey" TEXT;
ALTER TABLE "lessons" ADD COLUMN "titleKey" TEXT;
