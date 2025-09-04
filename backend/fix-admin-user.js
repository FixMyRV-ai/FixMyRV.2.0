// Fix admin user in production database
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:admin123@junction.proxy.rlwy.net:31918/railway';

async function fixAdminUser() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if admin user exists
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, ['admin@gmail.com']);
    
    if (userResult.rows.length === 0) {
      console.log('Admin user not found, creating...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Create admin user
      const insertQuery = `
        INSERT INTO users (email, password, firstname, lastname, role, phone, isverified, createdat, updatedat)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
      
      const insertResult = await client.query(insertQuery, [
        'admin@gmail.com',
        hashedPassword,
        'Admin',
        'User',
        'admin',
        '+1234567890',
        true
      ]);
      
      console.log('Admin user created:', insertResult.rows[0]);
    } else {
      console.log('Admin user exists:', userResult.rows[0]);
      
      // Update password to make sure it's correct
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2 RETURNING *';
      const updateResult = await client.query(updateQuery, [hashedPassword, 'admin@gmail.com']);
      
      console.log('Admin password updated:', updateResult.rows[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixAdminUser();
