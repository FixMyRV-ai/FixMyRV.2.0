#!/bin/bash
# Script to delete user from PostgreSQL

echo "Searching for user with email jorgerioscantu@hotmail.com..."
docker exec fixmyrv-postgres psql -U postgres -d fixmyrv -c "SELECT id, email, \"firstName\", \"lastName\", \"organizationId\" FROM \"OrganizationUsers\" WHERE email = 'jorgerioscantu@hotmail.com';"

echo "Deleting user..."
docker exec fixmyrv-postgres psql -U postgres -d fixmyrv -c "DELETE FROM \"OrganizationUsers\" WHERE email = 'jorgerioscantu@hotmail.com';"

echo "Verifying deletion..."
docker exec fixmyrv-postgres psql -U postgres -d fixmyrv -c "SELECT id, email, \"firstName\", \"lastName\", \"organizationId\" FROM \"OrganizationUsers\" WHERE email = 'jorgerioscantu@hotmail.com';"

echo "Done."
