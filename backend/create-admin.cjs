const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createAdminUser() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check for existing admin user
    const result = await client.query('SELECT * FROM users WHERE role = $1', ['admin']);
    console.log('Admin users found:', result.rows.length);

    if (result.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (email, password, role, "firstName", "lastName", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        ['admin@fixmyrv.com', hashedPassword, 'admin', 'Admin', 'User']
      );
      console.log('Admin user created successfully');
      console.log('Email: admin@fixmyrv.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists:', result.rows[0].email);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createAdminUser();
