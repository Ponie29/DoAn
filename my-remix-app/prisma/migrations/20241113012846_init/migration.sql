-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
