/*
  Warnings:

  - Added the required column `leaseType` to the `leases` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeaseType" AS ENUM ('BY_UNIT', 'BY_ROOM', 'BY_BED');

-- CreateEnum
CREATE TYPE "OccupantType" AS ENUM ('LEASE_HOLDER', 'OCCUPANT', 'ROOMMATE');

-- DropForeignKey
ALTER TABLE "leases" DROP CONSTRAINT "leases_assignedBedId_fkey";

-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "assignedRoomId" INTEGER,
ADD COLUMN     "assignedUnitId" INTEGER,
ADD COLUMN     "leaseType" "LeaseType" NOT NULL,
ALTER COLUMN "assignedBedId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "occupants" (
    "occupantId" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "occupantType" "OccupantType" NOT NULL,
    "moveInDate" TIMESTAMP(3),
    "moveOutDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupants_pkey" PRIMARY KEY ("occupantId")
);

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_assignedUnitId_fkey" FOREIGN KEY ("assignedUnitId") REFERENCES "units"("unitId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_assignedRoomId_fkey" FOREIGN KEY ("assignedRoomId") REFERENCES "rooms"("roomId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_assignedBedId_fkey" FOREIGN KEY ("assignedBedId") REFERENCES "beds"("bedId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("leaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupants" ADD CONSTRAINT "occupants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
