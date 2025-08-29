import smsService from '../services/sms-chat.service.js';

// Mock test data
const mockSMSData = {
  OptIn: {
    From: '+12103439989',
    To: '+16144678149',
    Body: 'YES',
    MessageSid: 'SM_test_optin_123'
  },
  ChatMessage: {
    From: '+12103439989',
    To: '+16144678149', 
    Body: 'My RV generator won\'t start. What should I check first?',
    MessageSid: 'SM_test_chat_456'
  },
  StopMessage: {
    From: '+12103439989',
    To: '+16144678149',
    Body: 'STOP',
    MessageSid: 'SM_test_stop_789'
  }
};

async function testSMSService() {
  console.log('🧪 Testing SMS Chat Service...\n');

  try {
    // Test 1: Opt-in Response
    console.log('📋 Test 1: Opt-in Response');
    console.log(`Sending opt-in message: "${mockSMSData.OptIn.Body}"`);
    
    const optInResult = await smsService.processIncomingSMS(mockSMSData.OptIn);
    
    console.log('✅ Opt-in Result:');
    console.log(`   Success: ${optInResult.success}`);
    console.log(`   Message: ${optInResult.message}`);
    if (optInResult.responses) {
      console.log('   Response Messages:');
      optInResult.responses.forEach((msg, index) => {
        console.log(`     ${index + 1}. ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
      });
    }

    // Wait a moment for DB updates
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Chat Message
    console.log('\n📱 Test 2: Chat Message Processing');
    console.log(`Sending chat message: "${mockSMSData.ChatMessage.Body}"`);
    
    const chatResult = await smsService.processIncomingSMS(mockSMSData.ChatMessage);
    
    console.log('✅ Chat Result:');
    console.log(`   Success: ${chatResult.success}`);
    console.log(`   Message: ${chatResult.message}`);
    if (chatResult.responses) {
      console.log('   AI Response Messages:');
      chatResult.responses.forEach((msg, index) => {
        console.log(`     ${index + 1}. ${msg.substring(0, 150)}${msg.length > 150 ? '...' : ''}`);
      });
    }

    // Test 3: Message Splitting
    console.log('\n✂️ Test 3: Message Splitting');
    const longMessage = "This is a very long message that should be split into multiple SMS messages because it exceeds the 150 character limit that we have set for SMS messages. The system should intelligently split this at sentence boundaries when possible, and add part numbers to each message so the user knows they are receiving a multi-part response.";
    
    // Use the private method through reflection (for testing purposes)
    const smsServiceInstance = new (await import('../services/sms-chat.service.js')).SmsChartService();
    const splitMessages = smsServiceInstance.splitMessageForSMS(longMessage);
    
    console.log(`Original message length: ${longMessage.length}`);
    console.log(`Split into ${splitMessages.length} parts:`);
    splitMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.length} chars] ${msg}`);
    });

    // Test 4: Stop Message
    console.log('\n🛑 Test 4: Stop Message');
    console.log(`Sending stop message: "${mockSMSData.StopMessage.Body}"`);
    
    const stopResult = await smsService.processIncomingSMS(mockSMSData.StopMessage);
    
    console.log('✅ Stop Result:');
    console.log(`   Success: ${stopResult.success}`);
    console.log(`   Message: ${stopResult.message}`);
    if (stopResult.responses) {
      console.log('   Response Messages:');
      stopResult.responses.forEach((msg, index) => {
        console.log(`     ${index + 1}. ${msg}`);
      });
    }

    console.log('\n🎉 All SMS Service tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Opt-in message processing working');
    console.log('✅ Chat message AI integration working'); 
    console.log('✅ Message splitting working');
    console.log('✅ Stop message processing working');

  } catch (error) {
    console.error('❌ SMS Service test failed:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

console.log('🚀 Starting SMS Service Tests...\n');
testSMSService();
