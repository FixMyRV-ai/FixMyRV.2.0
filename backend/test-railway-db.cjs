const { Client } = require('pg');

async function testRailwayDB() {
  console.log('🚄 RAILWAY DATABASE CONNECTION TEST');
  console.log('=====================================\n');
  
  // Test Railway DATABASE_URL (from .env.railway)
  const databaseUrl = "postgresql://postgres:uNKXnsjgAmcfmTgRjwFwOkfUXHBVOhiW@containers-us-west-145.railway.app:7524/railway";
  
  if (!databaseUrl) {
    console.error('❌ No DATABASE_URL found');
    return;
  }
  
  console.log('🔗 Testing Railway DATABASE_URL connection...');
  console.log('URL (masked):', databaseUrl.replace(/:[^:@]*@/, ':****@'));
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Railway requires SSL
    }
  });
  
  try {
    await client.connect();
    console.log('✅ Railway DB connected successfully!');
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Found ${tables.rows.length} tables:`);
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('❌ NO TABLES FOUND! This is the problem.');
    }
    
    // Try to check organizations specifically
    try {
      const orgCount = await client.query('SELECT COUNT(*) FROM organizations');
      console.log(`\n✅ Organizations count: ${orgCount.rows[0].count}`);
    } catch (orgError) {
      console.log(`\n❌ Organizations table error: ${orgError.message}`);
      
      // Try to create organizations table manually
      console.log('\n🛠️  Attempting to create organizations table...');
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS organizations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        
        await client.query(`
          INSERT INTO organizations (name) 
          VALUES ('Default Organization') 
          ON CONFLICT DO NOTHING;
        `);
        
        console.log('✅ Organizations table created and default org added');
        
      } catch (createError) {
        console.log(`❌ Table creation failed: ${createError.message}`);
      }
    }
    
    // Try to check other critical tables
    const criticalTables = ['organization_users', 'chats', 'users', 'twilio_settings'];
    
    for (const tableName of criticalTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${result.rows[0].count} records`);
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Railway DB connection failed:', error.message);
    console.error('Code:', error.code);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

testRailwayDB().catch(console.error);
