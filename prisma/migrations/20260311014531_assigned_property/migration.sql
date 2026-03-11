-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assignedPropertyId" INTEGER;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assignedPropertyId_fkey" FOREIGN KEY ("assignedPropertyId") REFERENCES "properties"("propertyId") ON DELETE SET NULL ON UPDATE CASCADE;
