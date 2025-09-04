// Test user creation to identify the registration issue
import { User } from './models/index.ts';
import { connectDB } from './config/database.ts';

async function testUserCreation() {
    try {
        console.log('🔄 Connecting to database...');
        await connectDB();
        console.log('✅ Database connected successfully');

        console.log('🔄 Testing user creation...');
        
        // Test the exact data being sent from the frontend
        const userData = {
            firstName: 'Test',
            lastName: 'User', 
            email: 'test@example.com',
            password: 'testpass123'
        };

        console.log('📝 User data:', userData);

        const newUser = await User.create(userData);
        console.log('✅ User created successfully:', {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
            type: newUser.type,
            plan_type: newUser.plan_type,
            credits: newUser.credits,
            verified: newUser.verified
        });

    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        console.error('📋 Full error:', error);
        
        // Check if it's a validation error
        if (error.name === 'SequelizeValidationError') {
            console.error('🔍 Validation errors:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path}: ${err.message}`);
            });
        }
        
        // Check if it's a unique constraint error  
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('🔍 Unique constraint errors:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path}: ${err.message}`);
            });
        }
    }
    
    process.exit(0);
}

testUserCreation();
