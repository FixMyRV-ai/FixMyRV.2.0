import bcrypt from 'bcrypt';
import pkg from 'pg';
const { Client } = pkg;

async function updateAdminPassword() {
  console.log('🚀 Starting admin password update...');
  
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'fixmyrv',
  });

  try {
    console.log('🔌 Attempting to connect to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Hash the password
    const password = '12345678';
    const saltRounds = 10;
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');

    // Update or insert admin user
    const updateQuery = `
      INSERT INTO users (
        "firstName", "lastName", email, password, role, verified, credits, "createdAt", "updatedAt"
      ) VALUES (
        'Admin', 'User', 'admin@gmail.com', $1, 'admin', true, 0, NOW(), NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        password = $1,
        role = 'admin',
        verified = true,
        "updatedAt" = NOW()
      RETURNING id, email, role;
    `;

    console.log('🔄 Updating admin user...');
    const result = await client.query(updateQuery, [hashedPassword]);
    console.log('✅ Admin user updated successfully:', result.rows[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

console.log('Script starting...');
updateAdminPassword().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
