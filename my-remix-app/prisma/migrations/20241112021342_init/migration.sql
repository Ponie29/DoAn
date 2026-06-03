/*
  Warnings:

  - The `healthConditions` column on the `Exercise` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "healthConditions",
ADD COLUMN     "healthConditions" TEXT[];
