import { OrganizationUser } from './models/index.js';

async function testOrgUsers() {
  try {
    console.log('Connecting to database...');
    const users = await OrganizationUser.findAll({
      raw: true,
      attributes: ['id', 'firstName', 'lastName', 'email', 'organizationId', 'createdAt']
    });
    
    console.log(`Found ${users.length} organization users:`);
    console.table(users);
    
    // Test specific organization
    const org1Users = await OrganizationUser.findAll({
      where: { organizationId: 1 },
      raw: true,
      attributes: ['id', 'firstName', 'lastName', 'email', 'organizationId']
    });
    
    console.log(`\nUsers in Organization 1: ${org1Users.length}`);
    console.table(org1Users);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

testOrgUsers();
