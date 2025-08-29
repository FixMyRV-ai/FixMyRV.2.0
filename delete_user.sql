\echo 'Searching for user with email jorgerioscantu@hotmail.com...'
SELECT id, email, "firstName", "lastName", "organizationId" FROM organization_users WHERE email = 'jorgerioscantu@hotmail.com';

\echo 'Deleting user...'
DELETE FROM organization_users WHERE email = 'jorgerioscantu@hotmail.com';

\echo 'Verifying deletion...'
SELECT id, email, "firstName", "lastName", "organizationId" FROM organization_users WHERE email = 'jorgerioscantu@hotmail.com';
