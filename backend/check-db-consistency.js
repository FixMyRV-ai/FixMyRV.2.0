const { Client } = require('pg');

async function checkDatabases() {
  console.log('=== DATABASE CONSISTENCY CHECK ===\n');

  // Dev Database (Docker - port 5433)
  console.log('📊 CHECKING DEV DATABASE (port 5433)');
  const devClient = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await devClient.connect();
    console.log('✅ Dev DB connected');
    
    const devOrgs = await devClient.query('SELECT COUNT(*) FROM organizations');
    const devOrgUsers = await devClient.query('SELECT COUNT(*) FROM organization_users');
    const devChats = await devClient.query("SELECT COUNT(*) FROM chats WHERE channel = 'sms'");
    const devTwilio = await devClient.query('SELECT COUNT(*) FROM twilio_settings');
    
    console.log('  - Organizations:', devOrgs.rows[0].count);
    console.log('  - Organization Users:', devOrgUsers.rows[0].count);
    console.log('  - SMS Conversations:', devChats.rows[0].count);
    console.log('  - Twilio Settings:', devTwilio.rows[0].count);
    
    // Check table structure
    const devTables = await devClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('  - Total Tables:', devTables.rows.length);
    console.log('  - Tables:', devTables.rows.map(r => r.table_name).join(', '));
    
    devClient.end();
    
  } catch (err) {
    console.log('❌ Dev DB error:', err.message);
  }

  console.log('\n📊 CHECKING PROD DATABASE (port 5432)');
  
  // Try different possible prod database configurations
  const prodConfigs = [
    { host: 'localhost', port: 5432, database: 'fixmyrv_prod', user: 'postgres', password: 'postgres' },
    { host: 'localhost', port: 5432, database: 'fixmyrv', user: 'postgres', password: 'postgres' },
    { host: 'localhost', port: 5432, database: 'fixmyrv_prod', user: 'postgres', password: 'postgres123' },
  ];
  
  let prodConnected = false;
  
  for (const config of prodConfigs) {
    const prodClient = new Client(config);
    
    try {
      await prodClient.connect();
      console.log('✅ Prod DB connected:', `${config.database}@${config.port}`);
      prodConnected = true;
      
      const prodOrgs = await prodClient.query('SELECT COUNT(*) FROM organizations');
      const prodOrgUsers = await prodClient.query('SELECT COUNT(*) FROM organization_users');
      const prodChats = await prodClient.query("SELECT COUNT(*) FROM chats WHERE channel = 'sms'");
      const prodTwilio = await prodClient.query('SELECT COUNT(*) FROM twilio_settings');
      
      console.log('  - Organizations:', prodOrgs.rows[0].count);
      console.log('  - Organization Users:', prodOrgUsers.rows[0].count);
      console.log('  - SMS Conversations:', prodChats.rows[0].count);
      console.log('  - Twilio Settings:', prodTwilio.rows[0].count);
      
      // Check table structure
      const prodTables = await prodClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('  - Total Tables:', prodTables.rows.length);
      console.log('  - Tables:', prodTables.rows.map(r => r.table_name).join(', '));
      
      prodClient.end();
      break;
      
    } catch (err) {
      console.log(`❌ Failed to connect to ${config.database}@${config.port}:`, err.message);
      try {
        prodClient.end();
      } catch {}
    }
  }
  
  if (!prodConnected) {
    console.log('\n🔍 No production database found locally.');
    console.log('   This likely means production is deployed on Railway or another cloud platform.');
    console.log('   Based on the .env.railway file, production uses Railway PostgreSQL.');
  }
}

checkDatabases().catch(console.error);
