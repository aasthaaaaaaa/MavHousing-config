/*
  Warnings:

  - You are about to drop the `bulletins` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bulletins" DROP CONSTRAINT "bulletins_authorId_fkey";

-- DropTable
DROP TABLE "bulletins";

-- DropEnum
DROP TYPE "BulletinTargetType";

-- DropEnum
DROP TYPE "BulletinType";
