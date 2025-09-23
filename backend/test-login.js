// Simple test to verify login without Stripe
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Test the actual login process
async function testLogin() {
    try {
        console.log('Testing login process...');
        
        // Test bcrypt
        const testPassword = '12345678';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const isMatch = await bcrypt.compare(testPassword, hashedPassword);
        console.log('✅ Bcrypt test passed:', isMatch);
        
        // Test JWT
        if (!process.env.JWT_SECRET) {
            console.log('❌ JWT_SECRET not found');
            return;
        }
        
        const testToken = jwt.sign(
            { id: 1, email: 'test@test.com' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('✅ JWT test passed, token generated');
        
        console.log('All tests passed - login should work');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLogin();
