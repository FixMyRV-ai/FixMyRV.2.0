// API endpoint to promote a user to admin (for Railway deployment)
import { Router, Request, Response, RequestHandler } from 'express';
import { User } from '../models/index.js';
import bcrypt from 'bcrypt';

const adminSetupRouter = Router();

// Temporary endpoint to create/update admin user
// This should be removed after initial setup
adminSetupRouter.post('/setup-admin', (async (req: Request, res: Response) => {
    try {
        const { email, password, secretKey } = req.body;
        
        // Simple security check - use a secret key
        if (secretKey !== 'SETUP_ADMIN_SECRET_2024') {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        console.log(`🔍 Setting up admin user: ${email}`);

        // Find or create user
        let user = await User.findOne({ where: { email } });
        
        if (user) {
            console.log('📝 Updating existing user to admin...');
            
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Update user to admin
            await user.update({
                password: hashedPassword,
                role: 'admin',
                verified: true,
                verificationToken: null,
                type: 'pro',
                plan_type: 'subscription',
                credits: 1000
            });
            
            console.log('✅ User updated to admin successfully');
        } else {
            console.log('➕ Creating new admin user...');
            
            user = await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email: email,
                password: password, // Will be hashed by model hook
                role: 'admin',
                verified: true,
                verificationToken: null,
                type: 'pro',
                plan_type: 'subscription',
                credits: 1000
            });
            
            console.log('✅ Admin user created successfully');
        }

        // Test the login
        const testLogin = await user.isValidPassword(password);
        
        res.status(200).json({
            success: true,
            message: 'Admin user setup completed',
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
        console.error('❌ Error setting up admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error setting up admin user',
            error: error.message 
        });
    }
}) as RequestHandler);

export default adminSetupRouter;
