SELECT id, "firstName", "lastName", email, phone, status 
FROM organization_users 
ORDER BY "createdAt" DESC 
LIMIT 5;
