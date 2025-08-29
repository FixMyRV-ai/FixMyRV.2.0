const { Client } = require('pg');

async function createTestSMSChats() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  const testChats = [
    {
      orgUserId: 9, // Mike Thompson
      title: 'Generator Issues',
      userMessage: 'My RV generator keeps shutting off after 5 minutes. Any ideas?',
      botResponse1: 'I can help you troubleshoot your generator issue. This is typically caused by a few common problems:',
      botResponse2: '1. Overheating due to blocked air vents\n2. Low oil level triggering safety shutdown\n3. Fuel supply issues\n4. Dirty air filter\n\nLet\'s start by checking the oil level and air vents.'
    },
    {
      orgUserId: 10, // Sarah Wilson  
      title: 'Water Pump Problems',
      userMessage: 'Water pump not working properly - low pressure throughout RV',
      botResponse1: 'Low water pressure can be frustrating! Let me help you identify the cause:',
      botResponse2: '1. Check if your fresh water tank has water\n2. Inspect pump fuse and connections\n3. Look for leaks in water lines\n4. Check if pump is priming properly\n\nStart with the water tank level and let me know what you find.'
    },
    {
      orgUserId: 11, // Bob Martinez
      title: 'AC Unit Issues', 
      userMessage: 'AC unit blowing warm air instead of cold. It\'s getting hot in here!',
      botResponse1: 'Hot weather and a non-working AC is no fun! Let\'s get this fixed quickly:',
      botResponse2: '1. Check if condenser coils are clean and unblocked\n2. Verify refrigerant levels (may need professional service)\n3. Replace air filter if dirty\n4. Check for proper 30/50 amp power supply\n\nStart with cleaning the coils and checking the filter.'
    },
    {
      orgUserId: 12, // Lisa Davis
      title: 'Electrical Problems',
      userMessage: 'Lights keep flickering and outlets not working on left side of RV',
      botResponse1: 'Electrical issues can be tricky but we\'ll troubleshoot systematically:',
      botResponse2: '1. Check main breaker panel for tripped breakers\n2. Test GFCI outlets - they may need reset\n3. Inspect connections at electrical panel\n4. Check 12V converter if lights are LED/12V\n\nSafety first - if you\'re not comfortable, contact an RV electrician.'
    },
    {
      orgUserId: 13, // Tom Johnson
      title: 'Slide Out Stuck',
      userMessage: 'Slide out room is stuck halfway. Won\'t go in or out. Help!',
      botResponse1: 'A stuck slide out is concerning but often fixable! Here\'s what to check:',
      botResponse2: '1. Check hydraulic fluid levels (if hydraulic system)\n2. Inspect for obstructions around slide mechanism\n3. Try manual override if available\n4. Check fuses related to slide system\n\nNEVER force it manually - this can cause serious damage!'
    },
    {
      orgUserId: 14, // Anna Brown
      title: 'URGENT: Propane Safety',
      userMessage: 'URGENT: Propane smell inside RV. Should I evacuate? What do I do?',
      botResponse1: '🚨 SAFETY FIRST - This is potentially dangerous! Take immediate action:',
      botResponse2: '1. EVACUATE immediately if smell is strong\n2. Turn OFF all propane appliances and main valve\n3. Open all windows and doors for ventilation\n4. NO smoking, flames, or electrical switches\n5. Call propane service technician\n\nIf smell persists or you feel unsafe, call emergency services!'
    },
    {
      orgUserId: 15, // Chris Garcia
      title: 'Maintenance Question',
      userMessage: 'Quick question - how often should I check tire pressure?',
      botResponse1: 'Great question! Regular tire maintenance is crucial for RV safety:',
      botResponse2: 'Check tire pressure:\n• Before every trip\n• At least monthly when parked\n• When temperature changes significantly\n\nUse a quality gauge and check when tires are cold. Also inspect for wear patterns, cracks, or damage each time.'
    }
  ];

  try {
    await client.connect();
    console.log('Creating test SMS conversations...');

    for (const chat of testChats) {
      // Create chat
      const chatResult = await client.query(`
        INSERT INTO chats ("organizationUserId", title, channel, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `, [chat.orgUserId, chat.title, 'sms']);
      
      const chatId = chatResult.rows[0].id;
      console.log(`✅ Created chat ${chatId}: ${chat.title}`);

      // Create user message
      await client.query(`
        INSERT INTO messages ("chatId", content, is_bot, "createdAt", "updatedAt", "smsMessageSid")
        VALUES ($1, $2, $3, NOW(), NOW(), $4)
      `, [chatId, chat.userMessage, false, `SM_test_${chatId}_user`]);

      // Create bot response 1
      await client.query(`
        INSERT INTO messages ("chatId", content, is_bot, "createdAt", "updatedAt", "smsBatchIndex", "smsBatchTotal")
        VALUES ($1, $2, $3, NOW() + INTERVAL '1 second', NOW() + INTERVAL '1 second', $4, $5)
      `, [chatId, chat.botResponse1, true, 1, 2]);

      // Create bot response 2  
      await client.query(`
        INSERT INTO messages ("chatId", content, is_bot, "createdAt", "updatedAt", "smsBatchIndex", "smsBatchTotal")
        VALUES ($1, $2, $3, NOW() + INTERVAL '2 seconds', NOW() + INTERVAL '2 seconds', $4, $5)
      `, [chatId, chat.botResponse2, true, 2, 2]);

      console.log(`   📝 Added 3 messages to chat ${chatId}`);
    }

    console.log('\n🎉 Test SMS conversations created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createTestSMSChats();
