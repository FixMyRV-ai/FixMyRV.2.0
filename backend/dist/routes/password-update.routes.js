// Simple password update endpoint
import { Router } from 'express';
import { sequelize } from '../models/index.js';
import bcrypt from 'bcrypt';
const passwordUpdateRouter = Router();
// Simple endpoint to update admin@gmail.com password
passwordUpdateRouter.get('/fix-admin-now', (async (req, res) => {
    try {
        console.log('🔄 Running SQL update for admin@gmail.com...');
        // Hash the password 12345678
        const hashedPassword = await bcrypt.hash('12345678', 10);
        // Run direct SQL update using sequelize
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
        console.log('✅ SQL Update executed, rows affected:', metadata);
        // Verify the update
        const [user] = await sequelize.query(`
            SELECT id, email, role, verified, type, "plan_type", credits 
            FROM users 
            WHERE email = 'admin@gmail.com'
        `);
        res.status(200).json({
            success: true,
            message: 'admin@gmail.com password updated to 12345678 via SQL',
            rowsAffected: metadata,
            user: user[0] || null
        });
    }
    catch (error) {
        console.error('❌ Error updating password:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating password',
            error: error.message
        });
    }
}));
export default passwordUpdateRouter;
//# sourceMappingURL=password-update.routes.js.map