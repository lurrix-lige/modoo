-- AlterTable
ALTER TABLE "white_noises" ADD COLUMN "duration" INTEGER;
ALTER TABLE "white_noises" ADD COLUMN "isLoopable" BOOLEAN DEFAULT true;
