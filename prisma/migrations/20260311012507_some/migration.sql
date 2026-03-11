/*
  Warnings:

  - The values [DESK_A,SECURITY] on the enum `StaffPosition` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StaffPosition_new" AS ENUM ('MANAGEMENT', 'RESIDENT_A', 'MAINTENANCE');
ALTER TABLE "users" ALTER COLUMN "staffPosition" TYPE "StaffPosition_new" USING ("staffPosition"::text::"StaffPosition_new");
ALTER TYPE "StaffPosition" RENAME TO "StaffPosition_old";
ALTER TYPE "StaffPosition_new" RENAME TO "StaffPosition";
DROP TYPE "public"."StaffPosition_old";
COMMIT;
