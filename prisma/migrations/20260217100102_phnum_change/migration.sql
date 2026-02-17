-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'STAFF', 'ADMIN', 'DRAFT');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('APPLICANT', 'RESIDENT');

-- CreateEnum
CREATE TYPE "StaffPosition" AS ENUM ('MANAGEMENT', 'RESIDENT_A', 'DESK_A', 'SECURITY');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'ACTIVE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK', 'CASH');

-- CreateEnum
CREATE TYPE "LeaseType" AS ENUM ('BY_UNIT', 'BY_ROOM', 'BY_BED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENCE_HALL', 'APARTMENT');

-- CreateEnum
CREATE TYPE "OccupantType" AS ENUM ('LEASE_HOLDER', 'OCCUPANT', 'ROOMMATE');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('PLUMBING', 'HVAC', 'ELECTRICAL', 'INTERNET', 'APPLIANCE', 'STRUCTURAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- CreateTable
CREATE TABLE "users" (
    "userId" SERIAL NOT NULL,
    "utaId" VARCHAR(10) NOT NULL,
    "netId" VARCHAR(20) NOT NULL,
    "fName" VARCHAR(50) NOT NULL,
    "mName" VARCHAR(50),
    "lName" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" BIGINT,
    "dob" TIMESTAMP(3),
    "gender" "Gender",
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "studentStatus" "StudentStatus",
    "staffPosition" "StaffPosition",
    "requiresAdaAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "properties" (
    "propertyId" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "leaseType" "LeaseType" NOT NULL,
    "phone" BIGINT,
    "totalCapacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("propertyId")
);

-- CreateTable
CREATE TABLE "units" (
    "unitId" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "unitNumber" VARCHAR(10) NOT NULL,
    "floorLevel" INTEGER,
    "requiresAdaAccess" BOOLEAN NOT NULL DEFAULT false,
    "maxOccupancy" INTEGER,

    CONSTRAINT "units_pkey" PRIMARY KEY ("unitId")
);

-- CreateTable
CREATE TABLE "rooms" (
    "roomId" SERIAL NOT NULL,
    "unitId" INTEGER NOT NULL,
    "roomLetter" CHAR(1) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("roomId")
);

-- CreateTable
CREATE TABLE "beds" (
    "bedId" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "bedLetter" VARCHAR(5) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("bedId")
);

-- CreateTable
CREATE TABLE "applications" (
    "appId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "term" VARCHAR(20) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "preferredPropertyId" INTEGER,
    "submissionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("appId")
);

-- CreateTable
CREATE TABLE "leases" (
    "leaseId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "leaseType" "LeaseType" NOT NULL,
    "assignedUnitId" INTEGER,
    "assignedRoomId" INTEGER,
    "assignedBedId" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDue" DECIMAL(10,2) NOT NULL,
    "dueThisMonth" DECIMAL(10,2) NOT NULL,
    "status" "LeaseStatus" NOT NULL DEFAULT 'SIGNED',
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("leaseId")
);

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

-- CreateTable
CREATE TABLE "payments" (
    "paymentId" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSuccessful" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("paymentId")
);

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
CREATE UNIQUE INDEX "users_utaId_key" ON "users"("utaId");

-- CreateIndex
CREATE UNIQUE INDEX "users_netId_key" ON "users"("netId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_term_key" ON "applications"("userId", "term");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("propertyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("roomId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_preferredPropertyId_fkey" FOREIGN KEY ("preferredPropertyId") REFERENCES "properties"("propertyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("leaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("leaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
