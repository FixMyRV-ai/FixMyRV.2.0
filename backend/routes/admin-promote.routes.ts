// One-time admin promotion endpoint
import { Router, Request, Response, RequestHandler } from 'express';
import { User } from '../models/index.js';
import bcrypt from 'bcrypt';

const adminPromoteRouter = Router();

// One-time endpoint to promote admin@gmail.com to admin status
adminPromoteRouter.post('/promote-admin', (async (req: Request, res: Response) => {
    try {
        console.log('🔑 Promoting admin@gmail.com to admin status...');

        // Find the admin@gmail.com user
        const user = await User.findOne({ where: { email: 'admin@gmail.com' } });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'admin@gmail.com user not found' 
            });
        }

        // Hash the password 12345678
        const hashedPassword = await bcrypt.hash('12345678', 10);
        
        // Update user to admin with correct password
        await user.update({
            password: hashedPassword,
            role: 'admin',
            verified: true,
            verificationToken: null,
            type: 'pro',
            plan_type: 'subscription',
            credits: 1000
        });
        
        console.log('✅ admin@gmail.com promoted to admin successfully');

        // Test the login
        const testLogin = await user.isValidPassword('12345678');
        
        res.status(200).json({
            success: true,
            message: 'admin@gmail.com promoted to admin successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                verified: user.verified,
                type: user.type,
                plan_type: user.plan_type,
                credits: user.credits
            },
            passwordTest: testLogin
        });

    } catch (error: any) {
        console.error('❌ Error promoting admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error promoting admin user',
            error: error.message 
        });
    }
}) as RequestHandler);

export default adminPromoteRouter;
