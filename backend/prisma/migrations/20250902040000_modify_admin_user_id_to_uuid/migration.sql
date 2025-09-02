-- Migration: Modify AdminUser ID to use UUID
-- Created at: 2025-09-02 04:00:00

-- Modify AdminUser table to use UUID default
ALTER TABLE "public"."AdminUser" 
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Update existing records to have UUID if they don't already
UPDATE "public"."AdminUser" 
SET "id" = gen_random_uuid() 
WHERE "id" IS NULL OR "id" = '';
