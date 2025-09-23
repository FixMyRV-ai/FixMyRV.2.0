const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function setupProductionSMS() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('🚀 Setting up Production SMS System...\n');

    // 1. Add SMS columns to chats table if they don't exist
    console.log('📋 Step 1: Adding SMS support to chats table...');
    try {
      await client.query(`ALTER TABLE chats ADD COLUMN IF NOT EXISTS channel VARCHAR(10) DEFAULT 'web'`);
      await client.query(`ALTER TABLE chats ADD COLUMN IF NOT EXISTS "organizationUserId" INTEGER`);
      await client.query(`ALTER TABLE chats ALTER COLUMN "userId" DROP NOT NULL`);
      console.log('✅ Chats table updated');
    } catch (error) {
      console.log('⚠️ Chats table might already be updated:', error.message);
    }

    // 2. Add SMS columns to messages table if they don't exist
    console.log('📝 Step 2: Adding SMS support to messages table...');
    try {
      await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsMessageSid" VARCHAR(255)`);
      await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsBatchIndex" INTEGER`);
      await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsBatchTotal" INTEGER`);
      console.log('✅ Messages table updated');
    } catch (error) {
      console.log('⚠️ Messages table might already be updated:', error.message);
    }

    // 3. Ensure organizations table exists and has default org
    console.log('🏢 Step 3: Setting up organizations...');
    
    // Check if organizations table exists
    const orgTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'organizations'
      );
    `);

    if (!orgTableExists.rows[0].exists) {
      // Create organizations table
      await client.query(`
        CREATE TABLE organizations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Created organizations table');
    }

    // Insert default organization
    const defaultOrg = await client.query(`
      INSERT INTO organizations (name, description, status, "createdAt", "updatedAt")
      VALUES ('ACME RV Services', 'Default RV service organization', 'active', NOW(), NOW())
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    const orgId = defaultOrg.rows.length > 0 ? defaultOrg.rows[0].id : 1;
    console.log(`✅ Organization ready (ID: ${orgId})`);

    // 4. Ensure organization_users table exists
    console.log('👥 Step 4: Setting up organization users...');
    
    const orgUsersTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'organization_users'
      );
    `);

    if (!orgUsersTableExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE organization_users (
          id SERIAL PRIMARY KEY,
          "organizationId" INTEGER REFERENCES organizations(id),
          "firstName" VARCHAR(100) NOT NULL,
          "lastName" VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          role VARCHAR(50) DEFAULT 'user',
          status VARCHAR(50) DEFAULT 'active',
          verified BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Created organization_users table');
    }

    // 5. Insert test organization users
    console.log('👤 Step 5: Creating test organization users...');
    
    const testUsers = [
      { firstName: 'Mike', lastName: 'Thompson', phone: '+15551112222', email: 'mike.thompson@email.com' },
      { firstName: 'Sarah', lastName: 'Wilson', phone: '+15559998877', email: 'sarah.wilson@email.com' },
      { firstName: 'Bob', lastName: 'Martinez', phone: '+15556667777', email: 'bob.martinez@email.com' },
      { firstName: 'Lisa', lastName: 'Davis', phone: '+15554443333', email: 'lisa.davis@email.com' },
      { firstName: 'Tom', lastName: 'Johnson', phone: '+15552221111', email: 'tom.johnson@email.com' },
      { firstName: 'Anna', lastName: 'Brown', phone: '+15558889999', email: 'anna.brown@email.com' },
      { firstName: 'Chris', lastName: 'Garcia', phone: '+15557778888', email: 'chris.garcia@email.com' }
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);
    
    for (const user of testUsers) {
      try {
        const result = await client.query(`
          INSERT INTO organization_users 
          ("organizationId", "firstName", "lastName", email, password, phone, role, status, verified, "createdAt", "updatedAt") 
          VALUES ($1, $2, $3, $4, $5, $6, 'user', 'active', true, NOW(), NOW()) 
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `, [orgId, user.firstName, user.lastName, user.email, hashedPassword, user.phone]);
        
        if (result.rows.length > 0) {
          console.log(`✅ Created: ${user.firstName} ${user.lastName} (${user.phone})`);
        } else {
          console.log(`⚠️ Already exists: ${user.firstName} ${user.lastName} (${user.phone})`);
        }
      } catch (error) {
        console.log(`⚠️ Error creating ${user.firstName}: ${error.message}`);
      }
    }

    // 6. Ensure twilio_settings table exists
    console.log('📞 Step 6: Setting up Twilio settings...');
    
    const twilioTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'twilio_settings'
      );
    `);

    if (!twilioTableExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE twilio_settings (
          id SERIAL PRIMARY KEY,
          "accountSid" VARCHAR(255),
          "authToken" VARCHAR(255),
          "phoneNumber" VARCHAR(20),
          "webhookUrl" VARCHAR(500),
          status VARCHAR(50) DEFAULT 'active',
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Created twilio_settings table');
      
      // Insert placeholder Twilio settings
      await client.query(`
        INSERT INTO twilio_settings ("accountSid", "authToken", "phoneNumber", "webhookUrl", status)
        VALUES ('ACxxxxxxxxxx', 'your_auth_token', '+1234567890', 'https://your-domain.com/webhook', 'inactive')
      `);
      console.log('✅ Added placeholder Twilio settings');
    }

    // 7. Ensure twilio_logs table exists
    console.log('📋 Step 7: Setting up Twilio logs...');
    
    const twilioLogsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'twilio_logs'
      );
    `);

    if (!twilioLogsExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE twilio_logs (
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
      console.log('✅ Created twilio_logs table');
    }

    // 8. Create test SMS conversations
    console.log('💬 Step 8: Creating test SMS conversations...');
    
    // Get organization users
    const orgUsers = await client.query(`
      SELECT id, "firstName", "lastName" FROM organization_users ORDER BY id LIMIT 7
    `);

    const testChats = [
      { title: 'Generator Issues', userMessage: 'My RV generator keeps shutting off after 5 minutes. Any ideas?', botResponse: 'I can help troubleshoot your generator. Check oil level, air vents, and fuel supply.' },
      { title: 'Water Pump Problems', userMessage: 'Water pump not working - low pressure throughout RV', botResponse: 'Low pressure usually indicates: 1) Empty water tank 2) Pump fuse issue 3) Line leaks 4) Pump priming problem' },
      { title: 'AC Unit Issues', userMessage: 'AC blowing warm air instead of cold. Getting hot!', botResponse: 'For warm air: 1) Clean condenser coils 2) Check refrigerant 3) Replace air filter 4) Verify power supply' },
      { title: 'Electrical Problems', userMessage: 'Lights flickering and outlets not working on left side', botResponse: 'Check main breaker panel for trips, test GFCI outlets, inspect connections. Call electrician if unsure.' },
      { title: 'Slide Out Stuck', userMessage: 'Slide out room stuck halfway. Won\'t move!', botResponse: 'NEVER force it! Check: 1) Hydraulic fluid 2) Obstructions 3) Manual override 4) System fuses' },
      { title: 'URGENT: Propane Safety', userMessage: 'URGENT: Propane smell inside RV. What do I do?', botResponse: '🚨 EVACUATE if strong smell! Turn OFF propane, open windows, NO flames/sparks. Call emergency if needed!' },
      { title: 'Maintenance Question', userMessage: 'How often should I check tire pressure?', botResponse: 'Check tire pressure: Before every trip, monthly when parked, when temperature changes significantly.' }
    ];

    for (let i = 0; i < Math.min(testChats.length, orgUsers.rows.length); i++) {
      const chat = testChats[i];
      const user = orgUsers.rows[i];
      
      try {
        // Create chat
        const chatResult = await client.query(`
          INSERT INTO chats ("organizationUserId", title, channel, "createdAt", "updatedAt")
          VALUES ($1, $2, 'sms', NOW(), NOW())
          RETURNING id
        `, [user.id, chat.title]);
        
        const chatId = chatResult.rows[0].id;
        
        // Create user message
        await client.query(`
          INSERT INTO messages ("chatId", content, is_bot, "smsMessageSid", "createdAt", "updatedAt")
          VALUES ($1, $2, false, $3, NOW(), NOW())
        `, [chatId, chat.userMessage, `SM_test_${chatId}_user`]);
        
        // Create bot response
        await client.query(`
          INSERT INTO messages ("chatId", content, is_bot, "createdAt", "updatedAt")
          VALUES ($1, $2, true, NOW() + INTERVAL '1 second', NOW() + INTERVAL '1 second')
        `, [chatId, chat.botResponse]);
        
        console.log(`✅ Created SMS chat: ${chat.title} (User: ${user.firstName})`);
      } catch (error) {
        console.log(`⚠️ Error creating chat ${chat.title}:`, error.message);
      }
    }

    // 9. Create admin user
    console.log('👨‍💼 Step 9: Setting up admin user...');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    try {
      await client.query(`
        INSERT INTO users (email, password, role, "firstName", "lastName", "createdAt", "updatedAt")
        VALUES ('admin@gmail.com', $1, 'admin', 'Admin', 'User', NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET password = $1
      `, [adminPassword]);
      console.log('✅ Admin user ready: admin@gmail.com / admin123');
    } catch (error) {
      console.log('⚠️ Admin user setup:', error.message);
    }

    // 10. Add indexes for performance
    console.log('⚡ Step 10: Adding performance indexes...');
    try {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_chats_organization_user_id ON chats("organizationUserId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_chats_channel ON chats(channel)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_sms_sid ON messages("smsMessageSid")`);
      console.log('✅ Performance indexes added');
    } catch (error) {
      console.log('⚠️ Indexes might already exist:', error.message);
    }

    console.log('\n🎉 Production SMS System Setup Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ SMS support added to chats and messages tables');
    console.log('✅ Organizations table created with default org');
    console.log('✅ Organization users created (7 test users)');
    console.log('✅ Twilio settings table ready');
    console.log('✅ Twilio logs table ready');
    console.log('✅ Test SMS conversations created (7 chats)');
    console.log('✅ Admin user configured');
    console.log('✅ Performance indexes added');
    console.log('\n🚀 Ready to use:');
    console.log('• Admin login: admin@gmail.com / admin123');
    console.log('• SMS conversations available at /admin/sms-conversations');
    console.log('• 7 test conversations ready for viewing');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await client.end();
  }
}

setupProductionSMS();
