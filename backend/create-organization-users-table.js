const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fix_my_rv',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root'
});

async function createTable() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS organization_users (
        id SERIAL PRIMARY KEY,
        "organizationId" INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        verified BOOLEAN DEFAULT false,
        "verificationToken" VARCHAR(255),
        "resetPasswordToken" VARCHAR(255),
        "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
        otp VARCHAR(6),
        "otpExpiry" TIMESTAMP WITH TIME ZONE,
        "profileImage" VARCHAR(255),
        phone VARCHAR(20) NOT NULL,
        department VARCHAR(255),
        "jobTitle" VARCHAR(255),
        "hireDate" DATE,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP WITH TIME ZONE
      );
    `;
    
    await client.query(createTableSQL);
    console.log('✅ organization_users table created successfully!');
    
    // Create index on organizationId for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON organization_users("organizationId");');
    console.log('✅ Index created on organizationId');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

createTable();
