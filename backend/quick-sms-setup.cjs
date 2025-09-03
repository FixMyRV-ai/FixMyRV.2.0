const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function setupSMSQuick() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('🚀 Quick SMS Setup...\n');

    // 1. Add SMS columns to chats table
    console.log('📋 Step 1: SMS support for chats...');
    await client.query(`ALTER TABLE chats ADD COLUMN IF NOT EXISTS channel VARCHAR(10) DEFAULT 'web'`);
    await client.query(`ALTER TABLE chats ADD COLUMN IF NOT EXISTS "organizationUserId" INTEGER`);
    await client.query(`ALTER TABLE chats ALTER COLUMN "userId" DROP NOT NULL`);
    console.log('✅ Chats updated');

    // 2. Add SMS columns to messages table  
    console.log('📝 Step 2: SMS support for messages...');
    await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsMessageSid" VARCHAR(255)`);
    await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsBatchIndex" INTEGER`);
    await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsBatchTotal" INTEGER`);
    console.log('✅ Messages updated');

    // 3. Get or create default organization
    console.log('🏢 Step 3: Default organization...');
    let orgId = 1;
    try {
      const orgResult = await client.query(`
        INSERT INTO organizations (name, description, "createdAt", "updatedAt")
        VALUES ('ACME RV Services', 'Default RV service organization', NOW(), NOW())
        RETURNING id
      `);
      orgId = orgResult.rows[0].id;
      console.log(`✅ Created organization ID: ${orgId}`);
    } catch (error) {
      // Organization might exist, get first one
      const existing = await client.query('SELECT id FROM organizations LIMIT 1');
      if (existing.rows.length > 0) {
        orgId = existing.rows[0].id;
        console.log(`✅ Using existing organization ID: ${orgId}`);
      }
    }

    // 4. Create organization users if they don't exist
    console.log('👥 Step 4: Organization users...');
    
    const testUsers = [
      { firstName: 'Mike', lastName: 'Thompson', phone: '+15551112222', email: 'mike.thompson@acmervs.com' },
      { firstName: 'Sarah', lastName: 'Wilson', phone: '+15559998877', email: 'sarah.wilson@acmervs.com' },
      { firstName: 'Bob', lastName: 'Martinez', phone: '+15556667777', email: 'bob.martinez@acmervs.com' },
      { firstName: 'Lisa', lastName: 'Davis', phone: '+15554443333', email: 'lisa.davis@acmervs.com' },
      { firstName: 'Tom', lastName: 'Johnson', phone: '+15552221111', email: 'tom.johnson@acmervs.com' },
      { firstName: 'Anna', lastName: 'Brown', phone: '+15558889999', email: 'anna.brown@acmervs.com' },
      { firstName: 'Chris', lastName: 'Garcia', phone: '+15557778888', email: 'chris.garcia@acmervs.com' }
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);
    let userIds = [];
    
    for (const user of testUsers) {
      try {
        const result = await client.query(`
          INSERT INTO organization_users 
          ("organizationId", "firstName", "lastName", email, password, phone, role, status, verified, "createdAt", "updatedAt") 
          VALUES ($1, $2, $3, $4, $5, $6, 'user', 'active', true, NOW(), NOW()) 
          RETURNING id
        `, [orgId, user.firstName, user.lastName, user.email, hashedPassword, user.phone]);
        
        userIds.push(result.rows[0].id);
        console.log(`✅ Created: ${user.firstName} ${user.lastName} (ID: ${result.rows[0].id})`);
      } catch (error) {
        // User might exist, try to get existing ID
        try {
          const existing = await client.query('SELECT id FROM organization_users WHERE email = $1', [user.email]);
          if (existing.rows.length > 0) {
            userIds.push(existing.rows[0].id);
            console.log(`⚠️ Exists: ${user.firstName} ${user.lastName} (ID: ${existing.rows[0].id})`);
          }
        } catch (e) {
          console.log(`⚠️ Error with ${user.firstName}: ${error.message}`);
        }
      }
    }

    // 5. Create test SMS conversations
    console.log('💬 Step 5: Test SMS conversations...');
    
    const testChats = [
      { title: 'Generator Issues', userMsg: 'My RV generator keeps shutting off after 5 minutes. Any ideas?', botMsg: 'I can help troubleshoot your generator. Check oil level, air vents, and fuel supply.' },
      { title: 'Water Pump Problems', userMsg: 'Water pump not working - low pressure throughout RV', botMsg: 'Low pressure usually indicates: 1) Empty water tank 2) Pump fuse issue 3) Line leaks 4) Pump priming problem' },
      { title: 'AC Unit Issues', userMsg: 'AC blowing warm air instead of cold. Getting hot!', botMsg: 'For warm air: 1) Clean condenser coils 2) Check refrigerant 3) Replace air filter 4) Verify power supply' },
      { title: 'Electrical Problems', userMsg: 'Lights flickering and outlets not working on left side', botMsg: 'Check main breaker panel for trips, test GFCI outlets, inspect connections. Call electrician if unsure.' },
      { title: 'Slide Out Stuck', userMsg: 'Slide out room stuck halfway. Won\'t move!', botMsg: 'NEVER force it! Check: 1) Hydraulic fluid 2) Obstructions 3) Manual override 4) System fuses' },
      { title: 'URGENT: Propane Safety', userMsg: 'URGENT: Propane smell inside RV. What do I do?', botMsg: '🚨 EVACUATE if strong smell! Turn OFF propane, open windows, NO flames/sparks. Call emergency if needed!' },
      { title: 'Maintenance Question', userMsg: 'How often should I check tire pressure?', botMsg: 'Check tire pressure: Before every trip, monthly when parked, when temperature changes significantly.' }
    ];

    for (let i = 0; i < Math.min(testChats.length, userIds.length); i++) {
      const chat = testChats[i];
      const userId = userIds[i];
      
      try {
        // Create chat
        const chatResult = await client.query(`
          INSERT INTO chats ("organizationUserId", title, channel, "createdAt", "updatedAt")
          VALUES ($1, $2, 'sms', NOW(), NOW())
          RETURNING id
        `, [userId, chat.title]);
        
        const chatId = chatResult.rows[0].id;
        
        // Create user message
        await client.query(`
          INSERT INTO messages ("chatId", content, is_bot, "smsMessageSid", "createdAt", "updatedAt")
          VALUES ($1, $2, false, $3, NOW(), NOW())
        `, [chatId, chat.userMsg, `SM_test_${chatId}`]);
        
        // Create bot response
        await client.query(`
          INSERT INTO messages ("chatId", content, is_bot, "createdAt", "updatedAt")
          VALUES ($1, $2, true, NOW() + INTERVAL '1 second', NOW() + INTERVAL '1 second')
        `, [chatId, chat.botMsg]);
        
        console.log(`✅ SMS chat: ${chat.title}`);
      } catch (error) {
        console.log(`⚠️ Error creating chat ${chat.title}:`, error.message);
      }
    }

    // 6. Setup admin user
    console.log('👨‍💼 Step 6: Admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    try {
      await client.query(`
        INSERT INTO users (email, password, role, "firstName", "lastName", "createdAt", "updatedAt")
        VALUES ('admin@gmail.com', $1, 'admin', 'Admin', 'User', NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET password = $1
      `, [adminPassword]);
      console.log('✅ Admin ready: admin@gmail.com / admin123');
    } catch (error) {
      console.log('⚠️ Admin setup:', error.message);
    }

    // 7. Create Twilio tables if needed
    console.log('📞 Step 7: Twilio tables...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS twilio_settings (
          id SERIAL PRIMARY KEY,
          "accountSid" VARCHAR(255),
          "authToken" VARCHAR(255),
          "phoneNumber" VARCHAR(20),
          "webhookUrl" VARCHAR(500),
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS twilio_logs (
          id SERIAL PRIMARY KEY,
          "messageSid" VARCHAR(255),
          "accountSid" VARCHAR(255),
          "fromNumber" VARCHAR(20),
          "toNumber" VARCHAR(20),
          "messageBody" TEXT,
          "numMedia" INTEGER DEFAULT 0,
          "webhookUrl" VARCHAR(500),
          "isTestMessage" BOOLEAN DEFAULT false,
          status VARCHAR(50),
          "errorMessage" TEXT,
          "processingTimeMs" INTEGER,
          "rawPayload" JSONB,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Twilio tables ready');
    } catch (error) {
      console.log('⚠️ Twilio tables:', error.message);
    }

    console.log('\n🎉 SMS System Ready!');
    console.log('\n📋 What\'s available:');
    console.log('• SMS conversations in database');
    console.log('• Admin login: admin@gmail.com / admin123');
    console.log('• Organization users with phone numbers');
    console.log('• Twilio integration tables');
    console.log('\n🚀 Next: Start your servers and visit /admin/sms-conversations');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

setupSMSQuick();
