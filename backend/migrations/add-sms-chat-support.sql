-- Migration: Add SMS support to Chat and Message tables
-- Date: 2025-08-29
-- Description: Extends existing chat system to support SMS conversations

-- Add SMS support fields to chats table
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS channel VARCHAR(10) DEFAULT 'web' CHECK (channel IN ('web', 'sms')),
ADD COLUMN IF NOT EXISTS "organizationUserId" INTEGER REFERENCES organization_users(id);

-- Modify userId to be nullable since SMS uses organizationUserId
ALTER TABLE chats 
ALTER COLUMN "userId" DROP NOT NULL;

-- Add SMS-specific fields to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS "smsMessageSid" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "smsBatchIndex" INTEGER,
ADD COLUMN IF NOT EXISTS "smsBatchTotal" INTEGER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_organization_user_id ON chats("organizationUserId");
CREATE INDEX IF NOT EXISTS idx_chats_channel ON chats(channel);
CREATE INDEX IF NOT EXISTS idx_messages_sms_sid ON messages("smsMessageSid");

-- Add comments for documentation
COMMENT ON COLUMN chats.channel IS 'Communication channel: web for web chat, sms for SMS conversations';
COMMENT ON COLUMN chats."organizationUserId" IS 'Reference to organization user for SMS conversations';
COMMENT ON COLUMN messages."smsMessageSid" IS 'Twilio SMS message SID for tracking';
COMMENT ON COLUMN messages."smsBatchIndex" IS 'Index of message part in batched SMS response (1-based)';
COMMENT ON COLUMN messages."smsBatchTotal" IS 'Total number of parts in batched SMS response';

-- Validate existing data - ensure userId or organizationUserId is set
-- (This constraint will be enforced at application level rather than database level
-- to maintain flexibility for future features)

-- Create a view for easier SMS conversation management
CREATE OR REPLACE VIEW sms_conversations AS
SELECT 
    c.id as chat_id,
    c.title,
    c."organizationUserId",
    ou."firstName",
    ou."lastName", 
    ou.email,
    ou.phone,
    ou.status as user_status,
    org.name as organization_name,
    c."createdAt" as conversation_started,
    c."updatedAt" as last_activity,
    COUNT(m.id) as message_count,
    MAX(m."createdAt") as last_message_at
FROM chats c
JOIN organization_users ou ON c."organizationUserId" = ou.id  
JOIN organizations org ON ou."organizationId" = org.id
LEFT JOIN messages m ON c.id = m."chatId"
WHERE c.channel = 'sms'
GROUP BY c.id, c.title, c."organizationUserId", ou."firstName", ou."lastName", 
         ou.email, ou.phone, ou.status, org.name, c."createdAt", c."updatedAt"
ORDER BY c."updatedAt" DESC;

-- Create a view for SMS message history
CREATE OR REPLACE VIEW sms_message_history AS
SELECT 
    m.id as message_id,
    m."chatId",
    m.content,
    m.is_bot,
    m."smsMessageSid",
    m."smsBatchIndex",
    m."smsBatchTotal", 
    m."createdAt",
    c.title as conversation_title,
    ou."firstName",
    ou."lastName",
    ou.phone,
    org.name as organization_name
FROM messages m
JOIN chats c ON m."chatId" = c.id
JOIN organization_users ou ON c."organizationUserId" = ou.id
JOIN organizations org ON ou."organizationId" = org.id  
WHERE c.channel = 'sms'
ORDER BY m."createdAt" DESC;

COMMIT;
