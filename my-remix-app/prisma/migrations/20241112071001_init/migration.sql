/*
  Warnings:

  - You are about to drop the column `intensityLevel` on the `Workout` table. All the data in the column will be lost.
  - The `instructions` column on the `Workout` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `healthConditions` column on the `Workout` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Workout" DROP COLUMN "intensityLevel",
ADD COLUMN     "secondaryMuscles" TEXT[],
DROP COLUMN "instructions",
ADD COLUMN     "instructions" TEXT[],
DROP COLUMN "healthConditions",
ADD COLUMN     "healthConditions" TEXT[];
