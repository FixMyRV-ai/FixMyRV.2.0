const { Client } = require('pg');

// Dev database connection
const devClient = new Client({
  host: 'localhost',
  port: 5433,
  database: 'fixmyrv',
  user: 'postgres',
  password: 'postgres'
});

// Production database connection (update these credentials as needed)
const prodClient = new Client({
  host: 'localhost',
  port: 5433, // Change this to your production port
  database: 'fixmyrv', // Change this to your production database name
  user: 'postgres', // Change this to your production user
  password: 'postgres' // Change this to your production password
});

async function copyDevToProduction() {
  try {
    console.log('🚀 Starting Dev to Production Data Copy...');
    
    // Connect to both databases
    await devClient.connect();
    await prodClient.connect();
    console.log('✅ Connected to both databases');

    // 1. Copy Twilio Settings Table Structure and Data
    console.log('\n📞 Copying Twilio Settings...');
    
    // Get table structure
    const twilioTableInfo = await devClient.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'twilio_settings'
      ORDER BY ordinal_position
    `);

    // Drop and recreate table in production
    await prodClient.query('DROP TABLE IF EXISTS twilio_settings CASCADE');
    
    let createTwilioTable = `
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
    
    await prodClient.query(createTwilioTable);
    console.log('✅ Twilio settings table created');

    // Copy twilio settings data
    const twilioData = await devClient.query('SELECT * FROM twilio_settings');
    if (twilioData.rows.length > 0) {
      for (const row of twilioData.rows) {
        await prodClient.query(`
          INSERT INTO twilio_settings ("accountSid", "authToken", "phoneNumber", "webhookUrl", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [row.accountSid, row.authToken, row.phoneNumber, row.webhookUrl, row.createdAt, row.updatedAt]);
      }
      console.log(`✅ Copied ${twilioData.rows.length} Twilio settings records`);
    }

    // 2. Copy Organizations Table
    console.log('\n🏢 Copying Organizations...');
    
    await prodClient.query('DROP TABLE IF EXISTS organizations CASCADE');
    
    let createOrgsTable = `
      CREATE TABLE organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await prodClient.query(createOrgsTable);
    console.log('✅ Organizations table created');

    // Copy organizations data
    const orgsData = await devClient.query('SELECT * FROM organizations');
    if (orgsData.rows.length > 0) {
      for (const row of orgsData.rows) {
        await prodClient.query(`
          INSERT INTO organizations (id, name, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4)
        `, [row.id, row.name, row.createdAt, row.updatedAt]);
      }
      console.log(`✅ Copied ${orgsData.rows.length} organizations records`);
    }

    // 3. Copy Organization Users Table
    console.log('\n👥 Copying Organization Users...');
    
    await prodClient.query('DROP TABLE IF EXISTS organization_users CASCADE');
    
    let createOrgUsersTable = `
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
    
    await prodClient.query(createOrgUsersTable);
    console.log('✅ Organization users table created');

    // Copy organization users data
    const orgUsersData = await devClient.query('SELECT * FROM organization_users ORDER BY id');
    if (orgUsersData.rows.length > 0) {
      for (const row of orgUsersData.rows) {
        await prodClient.query(`
          INSERT INTO organization_users (id, "organizationId", "firstName", "lastName", email, password, phone, role, status, verified, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [row.id, row.organizationId, row.firstName, row.lastName, row.email, row.password, row.phone, row.role, row.status, row.verified, row.createdAt, row.updatedAt]);
      }
      console.log(`✅ Copied ${orgUsersData.rows.length} organization users records`);
    }

    // 4. Update Chats Table for SMS Support
    console.log('\n💬 Updating Chats Table for SMS...');
    
    // Check if columns exist, if not add them
    try {
      await prodClient.query('ALTER TABLE chats ADD COLUMN IF NOT EXISTS channel VARCHAR(10) DEFAULT \'web\' CHECK (channel IN (\'web\', \'sms\'))');
      await prodClient.query('ALTER TABLE chats ADD COLUMN IF NOT EXISTS "organizationUserId" INTEGER REFERENCES organization_users(id)');
      await prodClient.query('ALTER TABLE chats ALTER COLUMN "userId" DROP NOT NULL');
      console.log('✅ Chats table updated for SMS support');
    } catch (error) {
      console.log('⚠️ Chats table might already be updated:', error.message);
    }

    // 5. Update Messages Table for SMS Support
    console.log('\n📝 Updating Messages Table for SMS...');
    
    try {
      await prodClient.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsMessageSid" VARCHAR(255)');
      await prodClient.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsBatchIndex" INTEGER');
      await prodClient.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS "smsBatchTotal" INTEGER');
      console.log('✅ Messages table updated for SMS support');
    } catch (error) {
      console.log('⚠️ Messages table might already be updated:', error.message);
    }

    // 6. Copy SMS Chats and Messages
    console.log('\n📱 Copying SMS Conversations...');
    
    const smsChats = await devClient.query('SELECT * FROM chats WHERE channel = \'sms\' ORDER BY id');
    if (smsChats.rows.length > 0) {
      for (const chat of smsChats.rows) {
        // Check if chat already exists
        const existing = await prodClient.query('SELECT id FROM chats WHERE id = $1', [chat.id]);
        if (existing.rows.length === 0) {
          await prodClient.query(`
            INSERT INTO chats (id, "userId", "organizationUserId", title, channel, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [chat.id, chat.userId, chat.organizationUserId, chat.title, chat.channel, chat.createdAt, chat.updatedAt]);
        }
      }
      console.log(`✅ Copied ${smsChats.rows.length} SMS chats`);

      // Copy messages for SMS chats
      const smsMessages = await devClient.query(`
        SELECT m.* FROM messages m 
        JOIN chats c ON m."chatId" = c.id 
        WHERE c.channel = 'sms' 
        ORDER BY m.id
      `);
      
      if (smsMessages.rows.length > 0) {
        for (const message of smsMessages.rows) {
          const existing = await prodClient.query('SELECT id FROM messages WHERE id = $1', [message.id]);
          if (existing.rows.length === 0) {
            await prodClient.query(`
              INSERT INTO messages (id, "chatId", content, is_bot, "smsMessageSid", "smsBatchIndex", "smsBatchTotal", "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [message.id, message.chatId, message.content, message.is_bot, message.smsMessageSid, message.smsBatchIndex, message.smsBatchTotal, message.createdAt, message.updatedAt]);
          }
        }
        console.log(`✅ Copied ${smsMessages.rows.length} SMS messages`);
      }
    }

    // 7. Update sequences to match the highest IDs
    console.log('\n🔢 Updating Sequences...');
    
    // Update sequences to prevent ID conflicts
    const maxOrgId = await prodClient.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM organizations');
    await prodClient.query(`ALTER SEQUENCE organizations_id_seq RESTART WITH ${maxOrgId.rows[0].next_id}`);
    
    const maxOrgUserId = await prodClient.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM organization_users');
    await prodClient.query(`ALTER SEQUENCE organization_users_id_seq RESTART WITH ${maxOrgUserId.rows[0].next_id}`);
    
    const maxChatId = await prodClient.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM chats');
    await prodClient.query(`ALTER SEQUENCE chats_id_seq RESTART WITH ${maxChatId.rows[0].next_id}`);
    
    const maxMessageId = await prodClient.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM messages');
    await prodClient.query(`ALTER SEQUENCE messages_id_seq RESTART WITH ${maxMessageId.rows[0].next_id}`);
    
    console.log('✅ Sequences updated');

    // 8. Create indexes for performance
    console.log('\n⚡ Creating Performance Indexes...');
    
    try {
      await prodClient.query('CREATE INDEX IF NOT EXISTS idx_chats_organization_user_id ON chats("organizationUserId")');
      await prodClient.query('CREATE INDEX IF NOT EXISTS idx_chats_channel ON chats(channel)');
      await prodClient.query('CREATE INDEX IF NOT EXISTS idx_messages_sms_sid ON messages("smsMessageSid")');
      await prodClient.query('CREATE INDEX IF NOT EXISTS idx_organization_users_phone ON organization_users(phone)');
      console.log('✅ Performance indexes created');
    } catch (error) {
      console.log('⚠️ Some indexes might already exist:', error.message);
    }

    console.log('\n🎉 Dev to Production Copy Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Twilio settings copied');
    console.log('✅ Organizations copied');
    console.log('✅ Organization users copied');
    console.log('✅ SMS chat support added');
    console.log('✅ SMS conversations copied');
    console.log('✅ Database sequences updated');
    console.log('✅ Performance indexes created');
    
    console.log('\n🚀 Ready to use:');
    console.log('• Twilio Settings: Available in admin panel');
    console.log('• Organization Users: Available in admin panel');
    console.log('• SMS Conversations: Available at /admin/sms-conversations');
    console.log('• Admin Login: admin@gmail.com / admin123');

  } catch (error) {
    console.error('❌ Error during copy:', error);
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

copyDevToProduction();
