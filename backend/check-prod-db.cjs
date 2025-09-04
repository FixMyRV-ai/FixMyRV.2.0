// Check production database admin user
const { Client } = require('pg');

// Railway production database URL
const DATABASE_URL = 'postgresql://postgres:admin123@junction.proxy.rlwy.net:31918/railway';

async function checkDatabase() {
  const client = new Client({ 
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('Connecting to production database...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);
    console.log('Users table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Check admin user
      const adminCheck = await client.query('SELECT * FROM users WHERE email = $1', ['admin@gmail.com']);
      console.log('Admin user found:', adminCheck.rows.length > 0);
      
      if (adminCheck.rows.length > 0) {
        console.log('Admin user details:', {
          id: adminCheck.rows[0].id,
          email: adminCheck.rows[0].email,
          role: adminCheck.rows[0].role,
          isverified: adminCheck.rows[0].isverified
        });
      } else {
        console.log('❌ Admin user NOT found in database');
      }
      
      // Show all users
      const allUsers = await client.query('SELECT email, role FROM users LIMIT 5');
      console.log('All users in database:', allUsers.rows);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();
