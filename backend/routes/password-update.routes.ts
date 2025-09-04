// Simple password update endpoint
import { Router, Request, Response, RequestHandler } from 'express';
import { User, sequelize } from '../models/index.js';
import bcrypt from 'bcrypt';

const passwordUpdateRouter = Router();

// Simple endpoint to update admin@gmail.com password
passwordUpdateRouter.get('/update-admin-password', (async (req: Request, res: Response) => {
    try {
        console.log('🔄 Updating admin@gmail.com password to 12345678...');

        // Find admin@gmail.com user
        const user = await User.findOne({ where: { email: 'admin@gmail.com' } });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'admin@gmail.com user not found' 
            });
        }

        // Hash password 12345678
        const hashedPassword = await bcrypt.hash('12345678', 10);
        
        // Update user
        await user.update({
            password: hashedPassword,
            role: 'admin',
            verified: true,
            verificationToken: null,
            type: 'pro',
            plan_type: 'subscription',
            credits: 1000
        });
        
        console.log('✅ admin@gmail.com password updated to 12345678');

        res.status(200).json({
            success: true,
            message: 'admin@gmail.com password updated to 12345678',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                verified: user.verified
            }
        });

    } catch (error: any) {
        console.error('❌ Error updating password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating password',
            error: error.message 
        });
    }
}) as RequestHandler);

export default passwordUpdateRouter;
