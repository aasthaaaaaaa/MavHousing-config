-- AlterTable
ALTER TABLE "maintenance_requests" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
