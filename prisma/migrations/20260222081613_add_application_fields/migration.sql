-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "classification" VARCHAR(50),
ADD COLUMN     "cleanliness" VARCHAR(50),
ADD COLUMN     "dietaryRestrictions" TEXT,
ADD COLUMN     "emergencyContactName" VARCHAR(100),
ADD COLUMN     "emergencyContactPhone" VARCHAR(20),
ADD COLUMN     "emergencyContactRelation" VARCHAR(50),
ADD COLUMN     "expectedGraduation" VARCHAR(20),
ADD COLUMN     "noiseLevel" VARCHAR(50),
ADD COLUMN     "sleepSchedule" VARCHAR(50),
ADD COLUMN     "smokingPreference" VARCHAR(50),
ADD COLUMN     "specialAccommodations" TEXT;
