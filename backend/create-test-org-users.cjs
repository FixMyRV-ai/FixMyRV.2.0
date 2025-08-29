const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createTestOrgUsers() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  const testUsers = [
    { firstName: 'Mike', lastName: 'Thompson', phone: '+15551112222', email: 'mike.thompson@email.com' },
    { firstName: 'Sarah', lastName: 'Wilson', phone: '+15559998877', email: 'sarah.wilson@email.com' },
    { firstName: 'Bob', lastName: 'Martinez', phone: '+15556667777', email: 'bob.martinez@email.com' },
    { firstName: 'Lisa', lastName: 'Davis', phone: '+15554443333', email: 'lisa.davis@email.com' },
    { firstName: 'Tom', lastName: 'Johnson', phone: '+15552221111', email: 'tom.johnson@email.com' },
    { firstName: 'Anna', lastName: 'Brown', phone: '+15558889999', email: 'anna.brown@email.com' },
    { firstName: 'Chris', lastName: 'Garcia', phone: '+15557778888', email: 'chris.garcia@email.com' }
  ];

  try {
    await client.connect();
    console.log('Creating test organization users...');

    for (const user of testUsers) {
      // Check if user already exists
      const existing = await client.query('SELECT id FROM organization_users WHERE phone = $1', [user.phone]);
      
      if (existing.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const result = await client.query(`
          INSERT INTO organization_users 
          ("organizationId", "firstName", "lastName", email, password, phone, role, status, verified, "createdAt", "updatedAt") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
          RETURNING id
        `, [1, user.firstName, user.lastName, user.email, hashedPassword, user.phone, 'user', 'active', true]);
        
        console.log(`✅ Created: ${user.firstName} ${user.lastName} (${user.phone}) - ID: ${result.rows[0].id}`);
      } else {
        console.log(`⚠️  Already exists: ${user.firstName} ${user.lastName} (${user.phone})`);
      }
    }

    console.log('\nAll organization users:');
    const allUsers = await client.query('SELECT id, "firstName", "lastName", phone FROM organization_users ORDER BY id');
    allUsers.rows.forEach(row => {
      console.log(`  - ID ${row.id}: ${row.firstName} ${row.lastName} (${row.phone})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createTestOrgUsers();
