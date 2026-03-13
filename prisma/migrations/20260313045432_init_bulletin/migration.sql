-- CreateEnum
CREATE TYPE "BulletinType" AS ENUM ('PHOTO', 'TEXT');

-- CreateEnum
CREATE TYPE "BulletinTargetType" AS ENUM ('ALL', 'PROPERTY', 'LEASE', 'PROPERTY_TYPE');

-- CreateTable
CREATE TABLE "bulletins" (
    "id" TEXT NOT NULL,
    "type" "BulletinType" NOT NULL,
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "targetType" "BulletinTargetType" NOT NULL,
    "targetPropertyIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "targetLeaseIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "targetPropertyTypes" "PropertyType"[] DEFAULT ARRAY[]::"PropertyType"[],

    CONSTRAINT "bulletins_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
