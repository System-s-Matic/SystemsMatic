/*
  Warnings:

  - You are about to drop the column `timezone` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "timezone",
ALTER COLUMN "scheduledAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "confirmedAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "cancelledAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "public"."Contact" ALTER COLUMN "consentAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "public"."EmailLog" ALTER COLUMN "sentAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "public"."Reminder" ALTER COLUMN "dueAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "sentAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6);
