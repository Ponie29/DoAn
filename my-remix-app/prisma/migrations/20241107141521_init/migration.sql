/*
  Warnings:

  - You are about to drop the `ExerciseRecommendation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Video` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bodyPart` to the `Workout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipment` to the `Workout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gifUrl` to the `Workout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructions` to the `Workout` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target` to the `Workout` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ExerciseRecommendation" DROP CONSTRAINT "ExerciseRecommendation_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "ExerciseRecommendation" DROP CONSTRAINT "ExerciseRecommendation_userId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_workoutId_fkey";

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "bodyPart" TEXT NOT NULL,
ADD COLUMN     "equipment" TEXT NOT NULL,
ADD COLUMN     "gifUrl" TEXT NOT NULL,
ADD COLUMN     "instructions" TEXT NOT NULL,
ADD COLUMN     "target" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- DropTable
DROP TABLE "ExerciseRecommendation";

-- DropTable
DROP TABLE "Video";

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
