/*
  Warnings:

  - A unique constraint covering the columns `[userId,term]` on the table `applications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('PLUMBING', 'HVAC', 'ELECTRICAL', 'INTERNET', 'APPLIANCE', 'STRUCTURAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "allowedGender" "Gender";

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "requestId" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "createdByUserId" INTEGER NOT NULL,
    "assignedStaffId" INTEGER,
    "category" "MaintenanceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("requestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_term_key" ON "applications"("userId", "term");

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("leaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
