/*
  Warnings:

  - You are about to drop the column `activity_level` on the `HealthStatus` table. All the data in the column will be lost.
  - You are about to drop the column `goal` on the `HealthStatus` table. All the data in the column will be lost.
  - You are about to drop the column `healthCondition` on the `HealthStatus` table. All the data in the column will be lost.
  - Added the required column `condition` to the `HealthStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fitnessGoals` to the `HealthStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intensityPreference` to the `HealthStatus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "HealthStatus" DROP COLUMN "activity_level",
DROP COLUMN "goal",
DROP COLUMN "healthCondition",
ADD COLUMN     "condition" TEXT NOT NULL,
ADD COLUMN     "equipmentPreference" TEXT[],
ADD COLUMN     "fitnessGoals" TEXT NOT NULL,
ADD COLUMN     "intensityPreference" TEXT NOT NULL,
ADD COLUMN     "targetMuscleGroups" TEXT[];
