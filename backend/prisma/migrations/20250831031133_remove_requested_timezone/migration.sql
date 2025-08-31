/*
  Warnings:

  - You are about to drop the column `requestedTimezone` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "requestedTimezone";
