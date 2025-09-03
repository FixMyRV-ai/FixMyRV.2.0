const { Client } = require('pg');

async function compareDBs() {
  console.log('🔍 DATABASE URL COMPARISON TEST');
  console.log('===============================\n');
  
  // Database we tested (working one)
  const workingDB = "postgresql://postgres:OofcMgUItaMxvQjyVYtgVGGZQvKTOYzf@crossover.proxy.rlwy.net:38782/railway";
  
  // Original database from .env.railway  
  const originalDB = "postgresql://postgres:uNKXnsjgAmcfmTgRjwFwOkfUXHBVOhiW@containers-us-west-145.railway.app:7524/railway";
  
  console.log('🔧 WORKING DB (the one we tested):');
  console.log('   ', workingDB.replace(/:[^:@]*@/, ':****@'));
  
  console.log('\n🚨 ORIGINAL DB (might be what Railway uses):');
  console.log('   ', originalDB.replace(/:[^:@]*@/, ':****@'));
  
  console.log('\n🧪 Testing ORIGINAL database for admin password...\n');
  
  const client = new Client({
    connectionString: originalDB,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Original DB connected successfully!');
    
    // Check for admin user with password 12345678
    const adminCheck = await client.query(`
      SELECT id, email, password, "firstName", "lastName" 
      FROM users 
      WHERE email = 'admin@gmail.com' 
      LIMIT 1
    `);
    
    if (adminCheck.rows.length > 0) {
      const admin = adminCheck.rows[0];
      console.log('👤 Found admin user:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Password: ${admin.password.substring(0, 10)}...`);
      console.log('\n🎯 THIS IS THE DATABASE RAILWAY IS USING!');
    } else {
      console.log('❌ No admin user found in original database');
    }
    
    // Check table count
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`\n📊 Tables in original DB: ${tables.rows.length}`);
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
  } catch (error) {
    console.log('❌ Original DB connection failed:', error.message);
    console.log('\n🔄 The original DB might be down, which is why we found the new one.');
    console.log('   Railway environment variables need to be updated!');
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

compareDBs().catch(console.error);
