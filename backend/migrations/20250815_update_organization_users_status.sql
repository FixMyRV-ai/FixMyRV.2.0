-- Migration to update organization_users status column
-- Add new status values: 'new_user' and 'invited'

-- Check current constraint name first, then drop it
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'organization_users_status_check') THEN
        ALTER TABLE organization_users DROP CONSTRAINT organization_users_status_check;
    END IF;
END
$$;

-- Add new check constraint with expanded values
ALTER TABLE organization_users ADD CONSTRAINT organization_users_status_check 
CHECK (status IN ('active', 'inactive', 'suspended', 'new_user', 'invited'));

-- Update the default value
ALTER TABLE organization_users ALTER COLUMN status SET DEFAULT 'new_user';

-- Update existing users with 'active' status to 'new_user' if they were recently created
UPDATE organization_users SET status = 'new_user' 
WHERE status = 'active' AND "createdAt" > NOW() - INTERVAL '1 day';
