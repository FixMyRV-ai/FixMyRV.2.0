// API endpoint to promote a user to admin (for Railway deployment)
import { Router, Request, Response, RequestHandler } from 'express';
import { User } from '../models/index.js';
import bcrypt from 'bcrypt';

const adminSetupRouter = Router();

// Temporary endpoint to create/update admin user
// This should be removed after initial setup
adminSetupRouter.post('/setup-admin', (async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        
        // For simplicity in production setup, remove secret key requirement
        // This endpoint should be removed after use
        console.log(`🔍 Setting up admin user: ${email || 'admin@gmail.com'}`);

        const adminEmail = email || 'admin@gmail.com';
        const adminPassword = password || '12345678';

        // Find or create user
        let user = await User.findOne({ where: { email: adminEmail } });
        
        if (user) {
            console.log('📝 Updating existing user to admin...');
            
            // Hash the password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
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
                email: adminEmail,
                password: adminPassword, // Will be hashed by model hook
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
        const testLogin = await user.isValidPassword(adminPassword);
        
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
