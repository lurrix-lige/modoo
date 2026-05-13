/*
  Warnings:

  - You are about to drop the `memberships` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "memberships";
PRAGMA foreign_keys=on;
