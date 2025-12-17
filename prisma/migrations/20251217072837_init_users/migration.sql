-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'STAFF', 'ADMIN', 'DRAFT');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('APPLICANT', 'RESIDENT');

-- CreateEnum
CREATE TYPE "StaffPosition" AS ENUM ('MANAGEMENT', 'RESIDENT_A', 'DESK_A', 'SECURITY');

-- CreateTable
CREATE TABLE "users" (
    "userId" SERIAL NOT NULL,
    "utaId" VARCHAR(10) NOT NULL,
    "netId" VARCHAR(20) NOT NULL,
    "fName" VARCHAR(50) NOT NULL,
    "mName" VARCHAR(50),
    "lName" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(15),
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

-- CreateIndex
CREATE UNIQUE INDEX "users_utaId_key" ON "users"("utaId");

-- CreateIndex
CREATE UNIQUE INDEX "users_netId_key" ON "users"("netId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
