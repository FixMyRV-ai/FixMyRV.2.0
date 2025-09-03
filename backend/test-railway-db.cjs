const { Client } = require('pg');

async function testRailwayDB() {
  console.log('🚄 RAILWAY DATABASE CONNECTION TEST');
  console.log('=====================================\n');
  
  // Test Railway DATABASE_URL (updated with correct URL)
  const databaseUrl = "postgresql://postgres:OofcMgUItaMxvQjyVYtgVGGZQvKTOYzf@crossover.proxy.rlwy.net:38782/railway";
  
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
    
    console.log(`\n📊 Found ${tables.rows.length} tables in Railway database:`);
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('❌ NO TABLES FOUND! This explains why the API fails.');
      console.log('   The database exists but is completely empty.');
    }
    
    // Try to check critical tables
    const criticalTables = ['organizations', 'organization_users', 'chats', 'messages', 'users', 'twilio_settings'];
    
    console.log('\n🔍 Checking critical tables:');
    for (const tableName of criticalTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`  ✅ ${tableName}: ${result.rows[0].count} records`);
      } catch (err) {
        console.log(`  ❌ ${tableName}: TABLE DOES NOT EXIST - ${err.message}`);
      }
    }
    
    // Try to manually create tables if they don't exist
    console.log('\n🛠️  Attempting to create missing tables...');
    
    try {
      // Create organizations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS organizations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('  ✅ Organizations table created/verified');
      
      // Insert default organization
      await client.query(`
        INSERT INTO organizations (name) 
        VALUES ('Default Organization') 
        ON CONFLICT DO NOTHING;
      `);
      console.log('  ✅ Default organization inserted');
      
      // Create organization_users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS organization_users (
          id SERIAL PRIMARY KEY,
          "organizationId" INTEGER REFERENCES organizations(id),
          "firstName" VARCHAR(255) NOT NULL,
          "lastName" VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          verified BOOLEAN DEFAULT false,
          phone VARCHAR(20) NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('  ✅ Organization users table created/verified');
      
      // Create chats table
      await client.query(`
        CREATE TABLE IF NOT EXISTS chats (
          id SERIAL PRIMARY KEY,
          channel VARCHAR(50) NOT NULL DEFAULT 'sms',
          "organizationId" INTEGER REFERENCES organizations(id),
          "customerPhone" VARCHAR(20) NOT NULL,
          "customerName" VARCHAR(255),
          status VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('  ✅ Chats table created/verified');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          "firstName" VARCHAR(255) NOT NULL,
          "lastName" VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          role VARCHAR(50) DEFAULT 'user',
          verified BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('  ✅ Users table created/verified');
      
      console.log('\n🎉 Railway database setup completed successfully!');
      
      // Check table count again
      const tablesAfter = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log(`📊 Total tables after setup: ${tablesAfter.rows.length}`);
      
    } catch (createError) {
      console.log(`❌ Table creation failed: ${createError.message}`);
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
