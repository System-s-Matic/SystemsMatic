/*
  Warnings:

  - You are about to drop the column `durationMinutes` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `lastEmailAt` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `reminderJobId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `reminderScheduledAt` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `reminderSentAt` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `requestedDurationMin` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `Appointment` table. All the data in the column will be lost.

*/

CREATE EXTENSION IF NOT EXISTS citext;



ALTER TABLE "public"."Appointment"
  DROP COLUMN "durationMinutes",
  DROP COLUMN "lastEmailAt",
  DROP COLUMN "location",
  DROP COLUMN "reminderJobId",
  DROP COLUMN "reminderScheduledAt",
  DROP COLUMN "reminderSentAt",
  DROP COLUMN "requestedDurationMin",
  DROP COLUMN "userAgent",
  ALTER COLUMN "scheduledAt" TYPE TIMESTAMPTZ(6) USING "scheduledAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "confirmedAt" TYPE TIMESTAMPTZ(6) USING "confirmedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "cancelledAt" TYPE TIMESTAMPTZ(6) USING "cancelledAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt"   TYPE TIMESTAMPTZ(6) USING "createdAt"   AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt"   TYPE TIMESTAMPTZ(6) USING "updatedAt"   AT TIME ZONE 'UTC',
  ALTER COLUMN "requestedAt" TYPE TIMESTAMPTZ(6) USING "requestedAt" AT TIME ZONE 'UTC';

ALTER TABLE "public"."Contact"
  ALTER COLUMN "consentAt" TYPE TIMESTAMPTZ(6) USING "consentAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "public"."EmailLog"
  ALTER COLUMN "to"     TYPE CITEXT,
  ALTER COLUMN "sentAt" TYPE TIMESTAMPTZ(6) USING "sentAt" AT TIME ZONE 'UTC';

CREATE TABLE "public"."Reminder" (
  "id"            TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "dueAt"         TIMESTAMPTZ(6) NOT NULL,
  "sentAt"        TIMESTAMPTZ(6),
  "providerRef"   TEXT,
  "createdAt"     TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Reminder_appointmentId_key" ON "public"."Reminder"("appointmentId");

ALTER TABLE "public"."Reminder"
  ADD CONSTRAINT "Reminder_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CHECK reason / reasonOther (version qualifiée)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointment_reason_other_chk'
  ) THEN
    ALTER TABLE "public"."Appointment"
    ADD CONSTRAINT appointment_reason_other_chk
    CHECK (
      (reason <> 'AUTRE' AND "reasonOther" IS NULL)
      OR
      (reason = 'AUTRE' AND "reasonOther" IS NOT NULL)
    );
  END IF;
END$$;
