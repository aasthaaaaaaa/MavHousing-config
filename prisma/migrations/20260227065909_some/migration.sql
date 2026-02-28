/*
  Warnings:

  - You are about to drop the column `classification` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `expectedGraduation` on the `applications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "applications" DROP COLUMN "classification",
DROP COLUMN "expectedGraduation";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profilePicUrl" TEXT;
