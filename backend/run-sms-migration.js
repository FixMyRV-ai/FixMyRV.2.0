import pgPkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pgPkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fix_my_rv',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root'
});

async function runSMSChatMigration() {
  try {
    console.log('🚀 Starting SMS Chat Migration...');
    await client.connect();
    console.log('✅ Database connected successfully');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add-sms-chat-support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('🎯 Changes applied:');
    console.log('   • Added channel field to chats table (web/sms)');
    console.log('   • Added organizationUserId field to chats table');
    console.log('   • Made userId nullable in chats table');
    console.log('   • Added SMS tracking fields to messages table');
    console.log('   • Created performance indexes');
    console.log('   • Created SMS conversation views for reporting');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Restart the backend server to load new model definitions');
    console.log('   2. Test SMS functionality with Twilio webhook');
    console.log('   3. Verify web chat still works correctly');

    // Test the new structure
    console.log('');
    console.log('🔍 Testing new table structure...');
    
    // Check if new columns exist
    const chatColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'chats' AND column_name IN ('channel', 'organizationUserId')
      ORDER BY column_name
    `);
    
    console.log('✅ Chat table columns added:');
    chatColumns.rows.forEach(row => {
      console.log(`   • ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    const messageColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns  
      WHERE table_name = 'messages' AND column_name IN ('smsMessageSid', 'smsBatchIndex', 'smsBatchTotal')
      ORDER BY column_name
    `);
    
    console.log('✅ Message table columns added:');
    messageColumns.rows.forEach(row => {
      console.log(`   • ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check if views were created
    const views = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_name IN ('sms_conversations', 'sms_message_history')
      ORDER BY table_name
    `);
    
    console.log('✅ Views created:');
    views.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    if (error.hint) {
      console.error('   Hint:', error.hint);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runSMSChatMigration();
