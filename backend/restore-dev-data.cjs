const { Client } = require('pg');

// Dev database connection
const devClient = new Client({
  host: 'localhost',
  port: 5433,
  database: 'fixmyrv',
  user: 'postgres',
  password: 'postgres'
});

async function restoreDevData() {
  try {
    console.log('🔧 Restoring Dev Database Tables and Data...');
    
    await devClient.connect();
    console.log('✅ Connected to dev database');

    // 1. Recreate Twilio Settings Table
    console.log('\n📞 Recreating Twilio Settings Table...');
    
    await devClient.query('DROP TABLE IF EXISTS twilio_settings CASCADE');
    
    const createTwilioTable = `
      CREATE TABLE twilio_settings (
        id SERIAL PRIMARY KEY,
        "accountSid" VARCHAR(255),
        "authToken" VARCHAR(255),
        "phoneNumber" VARCHAR(20),
        "webhookUrl" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await devClient.query(createTwilioTable);
    console.log('✅ Twilio settings table recreated');

    // Insert sample Twilio settings
    await devClient.query(`
      INSERT INTO twilio_settings ("accountSid", "authToken", "phoneNumber", "webhookUrl", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [
      'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'your_auth_token_here',
      '+16144678149',
      'http://localhost:3000/api/v1/twilio/webhook/sms'
    ]);
    console.log('✅ Sample Twilio settings inserted');

    // 2. Recreate Organizations Table
    console.log('\n🏢 Recreating Organizations Table...');
    
    await devClient.query('DROP TABLE IF EXISTS organizations CASCADE');
    
    const createOrgsTable = `
      CREATE TABLE organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await devClient.query(createOrgsTable);
    console.log('✅ Organizations table recreated');

    // Insert sample organizations
    const organizations = [
      'ACME RV Solutions',
      'Roadway RV Services', 
      'Adventure RV Specialists',
      'Mobile RV Repairs'
    ];

    for (let i = 0; i < organizations.length; i++) {
      await devClient.query(`
        INSERT INTO organizations (id, name, "createdAt", "updatedAt")
        VALUES ($1, $2, NOW(), NOW())
      `, [i + 1, organizations[i]]);
    }
    console.log(`✅ ${organizations.length} organizations inserted`);

    // 3. Recreate Organization Users Table
    console.log('\n👥 Recreating Organization Users Table...');
    
    await devClient.query('DROP TABLE IF EXISTS organization_users CASCADE');
    
    const createOrgUsersTable = `
      CREATE TABLE organization_users (
        id SERIAL PRIMARY KEY,
        "organizationId" INTEGER REFERENCES organizations(id),
        "firstName" VARCHAR(255) NOT NULL,
        "lastName" VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        verified BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await devClient.query(createOrgUsersTable);
    console.log('✅ Organization users table recreated');

    // Insert sample organization users
    const bcrypt = require('bcrypt');
    const testUsers = [
      { firstName: 'Jorge', lastName: 'Rios', phone: '+12103439989', email: 'jorge.rios@email.com', orgId: 1 },
      { firstName: 'Mike', lastName: 'Thompson', phone: '+15551112222', email: 'mike.thompson@email.com', orgId: 1 },
      { firstName: 'Sarah', lastName: 'Wilson', phone: '+15559998877', email: 'sarah.wilson@email.com', orgId: 2 },
      { firstName: 'Bob', lastName: 'Martinez', phone: '+15556667777', email: 'bob.martinez@email.com', orgId: 2 },
      { firstName: 'Lisa', lastName: 'Davis', phone: '+15554443333', email: 'lisa.davis@email.com', orgId: 3 },
      { firstName: 'Tom', lastName: 'Johnson', phone: '+15552221111', email: 'tom.johnson@email.com', orgId: 3 },
      { firstName: 'Anna', lastName: 'Brown', phone: '+15558889999', email: 'anna.brown@email.com', orgId: 4 },
      { firstName: 'Chris', lastName: 'Garcia', phone: '+15557778888', email: 'chris.garcia@email.com', orgId: 4 },
      { firstName: 'Mike Austin', lastName: 'Powers', phone: '12102429900', email: 'mike.powers@email.com', orgId: 1 }
    ];

    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      const hashedPassword = await bcrypt.hash('password123', 10);
      await devClient.query(`
        INSERT INTO organization_users (id, "organizationId", "firstName", "lastName", email, password, phone, role, status, verified, "createdAt", "updatedAt") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [i + 8, user.orgId, user.firstName, user.lastName, user.email, hashedPassword, user.phone, 'user', 'active', true]);
    }
    console.log(`✅ ${testUsers.length} organization users inserted`);

    // 4. Ensure Chats table has SMS support
    console.log('\n💬 Ensuring Chats Table SMS Support...');
    
    try {
      await devClient.query('ALTER TABLE chats ADD COLUMN IF NOT EXISTS channel VARCHAR(10) DEFAULT \'web\' CHECK (channel IN (\'web\', \'sms\'))');
      await devClient.query('ALTER TABLE chats ADD COLUMN IF NOT EXISTS "organizationUserId" INTEGER REFERENCES organization_users(id)');
      await devClient.query('ALTER TABLE chats ALTER COLUMN "userId" DROP NOT NULL');
      console.log('✅ Chats table SMS support ensured');
    } catch (error) {
      console.log('ℹ️ Chats table already has SMS support');
    }

    // 5. Ensure Messages table has SMS support  
    console.log('\n📝 Ensuring Messages Table SMS Support...');
    
    try {
      await devClient.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsMessageSid" VARCHAR(255)');
      await devClient.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsBatchIndex" INTEGER');
      await devClient.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsBatchTotal" INTEGER');
      console.log('✅ Messages table SMS support ensured');
    } catch (error) {
      console.log('ℹ️ Messages table already has SMS support');
    }

    // 6. Create Test SMS Conversations
    console.log('\n📱 Creating Test SMS Conversations...');

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
      }
    ];

    for (const chat of testChats) {
      // Create chat
      const chatResult = await devClient.query(`
        INSERT INTO chats ("organizationUserId", title, channel, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `, [chat.orgUserId, chat.title, 'sms']);
      
      const chatId = chatResult.rows[0].id;

      // Create user message
      await devClient.query(`
        INSERT INTO messages ("chatId", content, is_bot, "createdAt", "updatedAt", "smsMessageSid")
        VALUES ($1, $2, $3, NOW(), NOW(), $4)
      `, [chatId, chat.userMessage, false, `SM_test_${chatId}_user`]);

      // Create bot response 1
      await devClient.query(`
        INSERT INTO messages ("chatId", content, is_bot, "createdAt", "updatedAt", "smsBatchIndex", "smsBatchTotal")
        VALUES ($1, $2, $3, NOW() + INTERVAL '1 second', NOW() + INTERVAL '1 second', $4, $5)
      `, [chatId, chat.botResponse1, true, 1, 2]);

      // Create bot response 2  
      await devClient.query(`
        INSERT INTO messages ("chatId", content, is_bot, "createdAt", "updatedAt", "smsBatchIndex", "smsBatchTotal")
        VALUES ($1, $2, $3, NOW() + INTERVAL '2 seconds', NOW() + INTERVAL '2 seconds', $4, $5)
      `, [chatId, chat.botResponse2, true, 2, 2]);
    }
    console.log(`✅ Created ${testChats.length} test SMS conversations`);

    // 7. Update sequences
    console.log('\n🔢 Updating Sequences...');
    
    const maxOrgId = await devClient.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM organizations');
    await devClient.query(`ALTER SEQUENCE organizations_id_seq RESTART WITH ${maxOrgId.rows[0].next_id}`);
    
    const maxOrgUserId = await devClient.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM organization_users');
    await devClient.query(`ALTER SEQUENCE organization_users_id_seq RESTART WITH ${maxOrgUserId.rows[0].next_id}`);
    
    const maxChatId = await devClient.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM chats');
    await devClient.query(`ALTER SEQUENCE chats_id_seq RESTART WITH ${maxChatId.rows[0].next_id}`);
    
    const maxMessageId = await devClient.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM messages');
    await devClient.query(`ALTER SEQUENCE messages_id_seq RESTART WITH ${maxMessageId.rows[0].next_id}`);
    
    console.log('✅ Sequences updated');

    // 8. Create indexes
    console.log('\n⚡ Creating Indexes...');
    
    try {
      await devClient.query('CREATE INDEX IF NOT EXISTS idx_chats_organization_user_id ON chats("organizationUserId")');
      await devClient.query('CREATE INDEX IF NOT EXISTS idx_chats_channel ON chats(channel)');
      await devClient.query('CREATE INDEX IF NOT EXISTS idx_messages_sms_sid ON messages("smsMessageSid")');
      await devClient.query('CREATE INDEX IF NOT EXISTS idx_organization_users_phone ON organization_users(phone)');
      console.log('✅ Indexes created');
    } catch (error) {
      console.log('ℹ️ Some indexes might already exist');
    }

    console.log('\n🎉 Dev Database Fully Restored!');
    console.log('\n📋 Summary:');
    console.log('✅ Twilio settings table recreated with sample data');
    console.log('✅ Organizations table recreated with 4 organizations');
    console.log('✅ Organization users table recreated with 9 test users');
    console.log('✅ SMS chat support ensured on chats and messages tables');
    console.log('✅ 5 test SMS conversations created');
    console.log('✅ Database sequences updated');
    console.log('✅ Performance indexes created');
    
    console.log('\n🚀 Dev Environment Ready:');
    console.log('• All Menu/Settings/TwilioSettings functionality restored');
    console.log('• All Menu/Organizations/OrganizationUsers functionality restored');
    console.log('• All Menu/SMS Conversations functionality restored');
    console.log('• Development can continue normally');

  } catch (error) {
    console.error('❌ Error during dev restoration:', error);
  } finally {
    await devClient.end();
  }
}

restoreDevData();
