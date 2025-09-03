-- ================================================
-- FixMyRV - Create Organization Tables Migration
-- Date: 2025-09-03
-- Purpose: Create organizations and organization_users tables for SMS support
-- ================================================

BEGIN;

-- ================================================
-- Create Organizations Table
-- ================================================
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT "organizations_name_not_empty" CHECK (LENGTH(TRIM("name")) >= 2),
    CONSTRAINT "organizations_name_length" CHECK (LENGTH("name") <= 255)
);

-- Add indexes for organizations
CREATE INDEX IF NOT EXISTS "organizations_name_idx" ON "organizations" ("name");
CREATE INDEX IF NOT EXISTS "organizations_created_at_idx" ON "organizations" ("createdAt");

-- ================================================
-- Create Organization Users Table
-- ================================================
CREATE TABLE IF NOT EXISTS "organization_users" (
    "id" SERIAL PRIMARY KEY,
    "organizationId" INTEGER NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(10) NOT NULL DEFAULT 'user',
    "verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "phone" VARCHAR(20) NOT NULL,
    "status" VARCHAR(15) NOT NULL DEFAULT 'new_user',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT "fk_organization_users_organization_id" 
        FOREIGN KEY ("organizationId") 
        REFERENCES "organizations"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Check constraints
    CONSTRAINT "organization_users_role_check" 
        CHECK ("role" IN ('user', 'admin', 'manager')),
    CONSTRAINT "organization_users_status_check" 
        CHECK ("status" IN ('active', 'inactive', 'suspended', 'new_user', 'invited')),
    CONSTRAINT "organization_users_firstName_length" 
        CHECK (LENGTH("firstName") >= 1 AND LENGTH("firstName") <= 255),
    CONSTRAINT "organization_users_lastName_length" 
        CHECK (LENGTH("lastName") >= 1 AND LENGTH("lastName") <= 255),
    CONSTRAINT "organization_users_email_format" 
        CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT "organization_users_phone_length" 
        CHECK (LENGTH("phone") >= 1 AND LENGTH("phone") <= 20)
);

-- Add indexes for organization_users
CREATE UNIQUE INDEX IF NOT EXISTS "organization_users_org_email_unique" 
    ON "organization_users" ("organizationId", "email");
CREATE INDEX IF NOT EXISTS "organization_users_organization_id_index" 
    ON "organization_users" ("organizationId");
CREATE INDEX IF NOT EXISTS "organization_users_email_index" 
    ON "organization_users" ("email");
CREATE INDEX IF NOT EXISTS "organization_users_status_index" 
    ON "organization_users" ("status");
CREATE INDEX IF NOT EXISTS "organization_users_phone_index" 
    ON "organization_users" ("phone");
CREATE INDEX IF NOT EXISTS "organization_users_role_index" 
    ON "organization_users" ("role");

-- ================================================
-- Create sample data (optional - for testing)
-- ================================================

-- Create a default organization if none exists
INSERT INTO "organizations" ("name", "createdAt", "updatedAt")
SELECT 'FixMyRV Default Organization', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "organizations");

-- ================================================
-- Create Views for easier data management
-- ================================================

-- View for organization overview
CREATE OR REPLACE VIEW "organization_overview" AS
SELECT 
    o."id" as "organizationId",
    o."name" as "organizationName",
    o."createdAt" as "organizationCreated",
    COUNT(ou."id") as "totalUsers",
    COUNT(ou."id") FILTER (WHERE ou."status" = 'active') as "activeUsers",
    COUNT(ou."id") FILTER (WHERE ou."status" = 'new_user') as "newUsers",
    COUNT(ou."id") FILTER (WHERE ou."status" = 'invited') as "invitedUsers",
    COUNT(ou."id") FILTER (WHERE ou."role" = 'admin') as "adminUsers",
    COUNT(ou."id") FILTER (WHERE ou."role" = 'manager') as "managerUsers",
    MAX(ou."createdAt") as "lastUserAdded"
FROM "organizations" o
LEFT JOIN "organization_users" ou ON o."id" = ou."organizationId"
GROUP BY o."id", o."name", o."createdAt"
ORDER BY o."name";

-- View for active organization users
CREATE OR REPLACE VIEW "active_organization_users" AS
SELECT 
    ou."id",
    ou."organizationId",
    o."name" as "organizationName",
    ou."firstName",
    ou."lastName",
    CONCAT(ou."firstName", ' ', ou."lastName") as "fullName",
    ou."email",
    ou."phone",
    ou."role",
    ou."status",
    ou."verified",
    ou."createdAt",
    ou."updatedAt"
FROM "organization_users" ou
JOIN "organizations" o ON ou."organizationId" = o."id"
WHERE ou."status" IN ('active', 'new_user')
ORDER BY o."name", ou."lastName", ou."firstName";

-- ================================================
-- Grant Permissions (adjust as needed)
-- ================================================

-- Grant permissions to application user (uncomment and modify as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "organizations" TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON "organization_users" TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE "organizations_id_seq" TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE "organization_users_id_seq" TO your_app_user;

-- ================================================
-- Verification Queries
-- ================================================

-- Verify tables were created successfully
DO $$
BEGIN
    -- Check if organizations table exists
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        RAISE NOTICE '✅ Table "organizations" created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create "organizations" table';
    END IF;
    
    -- Check if organization_users table exists
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'organization_users') THEN
        RAISE NOTICE '✅ Table "organization_users" created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create "organization_users" table';
    END IF;
END $$;

-- Show created tables info
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('organizations', 'organization_users')
ORDER BY tablename;

-- Show created indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('organizations', 'organization_users')
ORDER BY tablename, indexname;

-- Show foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('organizations', 'organization_users');

COMMIT;

-- ================================================
-- Success Message
-- ================================================
\echo '🎉 Organization Tables Migration Completed Successfully!'
\echo '📋 Tables created: organizations, organization_users'
\echo '👥 Views created: organization_overview, active_organization_users'
\echo '🔗 Foreign key relationships established'
\echo '📊 Indexes and constraints added for performance and data integrity'
\echo ''
\echo '🚀 Your SMS conversation feature should now work properly!'
