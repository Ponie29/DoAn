/*
  Warnings:

  - Added the required column `difficulty` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `healthConditions` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intensity` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "difficulty" TEXT NOT NULL,
ADD COLUMN     "healthConditions" TEXT NOT NULL,
ADD COLUMN     "intensity" TEXT NOT NULL,
ADD COLUMN     "time" INTEGER NOT NULL;
