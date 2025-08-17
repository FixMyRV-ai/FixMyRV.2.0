UPDATE organization_users 
SET phone = '+1' || phone 
WHERE id = 8 AND phone NOT LIKE '+%';
