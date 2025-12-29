/*
  Warnings:

  - You are about to drop the column `rentAmount` on the `leases` table. All the data in the column will be lost.
  - You are about to drop the column `allowedGender` on the `units` table. All the data in the column will be lost.
  - You are about to drop the column `genderPolicy` on the `units` table. All the data in the column will be lost.
  - Added the required column `dueThisMonth` to the `leases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalDue` to the `leases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaseType` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `propertyType` on the `properties` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENCE_HALL', 'APARTMENT');

-- AlterTable
ALTER TABLE "leases" DROP COLUMN "rentAmount",
ADD COLUMN     "dueThisMonth" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "totalDue" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "leaseType" "LeaseType" NOT NULL,
DROP COLUMN "propertyType",
ADD COLUMN     "propertyType" "PropertyType" NOT NULL;

-- AlterTable
ALTER TABLE "units" DROP COLUMN "allowedGender",
DROP COLUMN "genderPolicy";
