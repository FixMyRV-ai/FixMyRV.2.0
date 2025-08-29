const { Client } = require('pg');

async function checkLatestChats() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    
    const chats = await client.query('SELECT * FROM chats WHERE channel = $1 ORDER BY "createdAt" DESC LIMIT 10', ['sms']);
    console.log('Recent SMS chats:');
    chats.rows.forEach(row => {
      console.log(`  - Chat ${row.id} | OrgUser: ${row.organizationUserId} | Title: ${row.title} | Created: ${row.createdAt}`);
    });
    
    console.log('\nAll organization users:');
    const orgUsers = await client.query('SELECT id, "firstName", "lastName", phone FROM organization_users');
    orgUsers.rows.forEach(row => {
      console.log(`  - OrgUser ${row.id} | ${row.firstName} ${row.lastName} | Phone: ${row.phone}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkLatestChats();
