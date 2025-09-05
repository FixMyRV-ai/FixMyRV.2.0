// Direct PostgreSQL update for admin@gmail.com password
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function updateAdminPassword() {
    // Railway PostgreSQL connection with explicit config
    const client = new Client({
        host: 'junction.proxy.rlwy.net',
        port: 31543,
        user: 'postgres',
        password: 'bNOtVaHbegJZGDQGJJjfkXSjCZTznbGy',
        database: 'railway',
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
    });

    try {
        console.log('🔄 Connecting to Railway PostgreSQL...');
        await client.connect();
        console.log('✅ Connected to database');

        // Hash the password 12345678
        const hashedPassword = await bcrypt.hash('12345678', 10);
        
        // Update admin@gmail.com user
        const updateQuery = `
            UPDATE users 
            SET password = $1, 
                role = 'admin', 
                verified = true, 
                "verificationToken" = null,
                type = 'pro',
                "plan_type" = 'subscription',
                credits = 1000
            WHERE email = 'admin@gmail.com'
            RETURNING id, email, role, verified, type, "plan_type", credits;
        `;

        console.log('🔄 Updating admin@gmail.com user...');
        const result = await client.query(updateQuery, [hashedPassword]);
        
        if (result.rows.length > 0) {
            console.log('✅ Successfully updated admin@gmail.com:');
            console.log(result.rows[0]);
        } else {
            console.log('❌ No user found with email admin@gmail.com');
        }

    } catch (error) {
        console.error('❌ Error updating admin user:', error);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

updateAdminPassword();
