const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetAdminPassword() {
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

    // Update admin password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const result = await client.query(
      'UPDATE users SET password = $1 WHERE email = $2 AND role = $3',
      [hashedPassword, 'admin@gmail.com', 'admin']
    );
    
    if (result.rowCount > 0) {
      console.log('Admin password updated successfully');
      console.log('Email: admin@gmail.com');
      console.log('Password: admin123');
    } else {
      console.log('No admin user found to update');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

resetAdminPassword();
