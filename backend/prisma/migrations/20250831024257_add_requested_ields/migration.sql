/*
  Warnings:

  - Added the required column `requestedAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "requestedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "requestedDurationMin" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "requestedTimezone" TEXT NOT NULL DEFAULT 'America/Guadeloupe',
ALTER COLUMN "timezone" SET DEFAULT 'America/Guadeloupe';
