// Test script for Twilio webhook endpoints
// Run with: node test-twilio-webhook.js

const testWebhookStatus = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/twilio/webhook/status');
    const data = await response.json();
    console.log('📊 Webhook Status:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error checking webhook status:', error.message);
  }
};

const testSimulatedSms = async () => {
  try {
    const testPayload = {
      from: '+1234567890',
      to: '+1987654321',
      body: 'Hello from test simulator! This is a test SMS message.'
    };

    console.log('📱 Sending test SMS:', testPayload);

    const response = await fetch('http://localhost:3000/api/v1/twilio/test/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    console.log('✅ Test SMS Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error testing SMS:', error.message);
  }
};

const runTests = async () => {
  console.log('🚀 Starting Twilio webhook tests...\n');
  
  await testWebhookStatus();
  console.log('\n' + '='.repeat(50) + '\n');
  await testSimulatedSms();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Configure Twilio settings in admin panel');
  console.log('2. Use webhook URL in Twilio console for production');
  console.log('3. Use test endpoint for local development');
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testWebhookStatus,
  testSimulatedSms,
  runTests
};
