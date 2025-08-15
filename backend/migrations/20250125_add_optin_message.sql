-- Migration to add optinMessage field to TwilioSettings
-- This ensures existing records get the default opt-in message

ALTER TABLE "TwilioSettings" 
ADD COLUMN IF NOT EXISTS "optinMessage" TEXT DEFAULT 'Welcome to FixMyRV.ai! You have successfully opted in to receive SMS notifications from our service account. Reply STOP to opt out at any time.';

-- Update existing records that don't have an opt-in message
UPDATE "TwilioSettings" 
SET "optinMessage" = 'Welcome to FixMyRV.ai! You have successfully opted in to receive SMS notifications from our service account. Reply STOP to opt out at any time.'
WHERE "optinMessage" IS NULL OR "optinMessage" = '';

-- Add comment for documentation
COMMENT ON COLUMN "TwilioSettings"."optinMessage" IS 'Default opt-in message sent to users when they subscribe to SMS notifications';
