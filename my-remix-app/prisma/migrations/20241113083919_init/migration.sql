-- DropForeignKey
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_workoutId_fkey";

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
