/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `WorkoutPlan` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `WorkoutPlan` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `WorkoutPlan` table. All the data in the column will be lost.
  - You are about to drop the column `workoutId` on the `WorkoutPlan` table. All the data in the column will be lost.
  - Added the required column `days` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exerciseName` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reps` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sets` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WorkoutPlan" DROP CONSTRAINT "WorkoutPlan_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutPlan" DROP CONSTRAINT "WorkoutPlan_workoutId_fkey";

-- AlterTable
ALTER TABLE "Workout" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Workout_id_seq";

-- AlterTable
ALTER TABLE "WorkoutPlan" DROP COLUMN "dayOfWeek",
DROP COLUMN "duration",
DROP COLUMN "startTime",
DROP COLUMN "workoutId",
ADD COLUMN     "days" TEXT NOT NULL,
ADD COLUMN     "exerciseName" TEXT NOT NULL,
ADD COLUMN     "reps" INTEGER NOT NULL,
ADD COLUMN     "sets" INTEGER NOT NULL,
ADD COLUMN     "time" INTEGER NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
