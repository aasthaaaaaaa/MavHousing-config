-- AlterEnum
ALTER TYPE "LeaseStatus" ADD VALUE 'TERMINATION_REQUESTED';

-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "terminationFee" DECIMAL(10,2),
ADD COLUMN     "terminationReason" TEXT;
