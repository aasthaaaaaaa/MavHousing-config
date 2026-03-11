-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockReason" TEXT;
