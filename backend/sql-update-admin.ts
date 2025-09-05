// Direct SQL update for admin password
import { sequelize } from './models/index.js';
import bcrypt from 'bcrypt';

async function updateAdminPasswordSQL() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Hash the password 12345678
        const hashedPassword = await bcrypt.hash('12345678', 10);
        console.log('🔐 Password hashed');

        // Run direct SQL update
        const [results, metadata] = await sequelize.query(`
            UPDATE users 
            SET 
                password = :hashedPassword,
                role = 'admin',
                verified = true,
                "verificationToken" = null,
                type = 'pro',
                "plan_type" = 'subscription',
                credits = 1000,
                "updatedAt" = NOW()
            WHERE email = 'admin@gmail.com'
        `, {
            replacements: { hashedPassword }
        });

        console.log('✅ SQL Update executed');
        console.log('Rows affected:', metadata);

        // Verify the update
        const [user] = await sequelize.query(`
            SELECT id, email, role, verified, type, "plan_type", credits 
            FROM users 
            WHERE email = 'admin@gmail.com'
        `);

        if (user.length > 0) {
            console.log('✅ admin@gmail.com user updated:');
            console.log(user[0]);
        } else {
            console.log('❌ No user found with email admin@gmail.com');
        }

    } catch (error) {
        console.error('❌ Error updating admin user:', error);
    }
    
    process.exit(0);
}

updateAdminPasswordSQL();
