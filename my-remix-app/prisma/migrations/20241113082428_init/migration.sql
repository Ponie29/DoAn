/*
  Warnings:

  - You are about to drop the column `duration` on the `UserProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserProgress" DROP COLUMN "duration",
ADD COLUMN     "timeSpent" INTEGER;
