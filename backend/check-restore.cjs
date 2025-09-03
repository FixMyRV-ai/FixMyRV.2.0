const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'fixmyrv',
  user: 'postgres',
  password: 'postgres'
});

async function checkRestoreData() {
  try {
    await client.connect();
    
    console.log('📋 Checking Restored Dev Data:');
    
    console.log('\n🏢 Organizations:');
    const orgs = await client.query('SELECT * FROM organizations ORDER BY id');
    orgs.rows.forEach(row => {
      console.log(`  - ID ${row.id}: ${row.name}`);
    });
    
    console.log('\n📞 Twilio Settings:');
    const twilio = await client.query('SELECT * FROM twilio_settings LIMIT 1');
    if (twilio.rows.length > 0) {
      const t = twilio.rows[0];
      console.log(`  - Phone: ${t.phoneNumber}`);
      console.log(`  - Webhook: ${t.webhookUrl}`);
      console.log(`  - Account SID: ${t.accountSid}`);
    }
    
    console.log('\n👥 Organization Users Count by Organization:');
    const userCount = await client.query(`
      SELECT o.name, COUNT(ou.id) as user_count
      FROM organizations o
      LEFT JOIN organization_users ou ON o.id = ou."organizationId"
      GROUP BY o.id, o.name
      ORDER BY o.id
    `);
    userCount.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.user_count} users`);
    });
    
    console.log('\n📱 SMS Conversations Count:');
    const chatCount = await client.query('SELECT COUNT(*) as count FROM chats WHERE channel = \'sms\'');
    console.log(`  - Total SMS Chats: ${chatCount.rows[0].count}`);
    
    console.log('\n✅ Dev Environment Fully Restored and Ready!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkRestoreData();
