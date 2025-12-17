-- CreateTable
CREATE TABLE "properties" (
    "propertyId" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "propertyType" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20),
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
    "genderPolicy" BOOLEAN NOT NULL DEFAULT false,
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

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("propertyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("unitId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("roomId") ON DELETE CASCADE ON UPDATE CASCADE;
