/*
  Warnings:

  - The `condition` column on the `HealthStatus` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "HealthStatus" DROP COLUMN "condition",
ADD COLUMN     "condition" TEXT[];
