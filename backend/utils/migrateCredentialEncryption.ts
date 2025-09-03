import { Setting, TwilioSetting } from '../models/index.js';
import CredentialEncryption from './credentialEncryption.js';

(async () => {
  try {
    console.log('🔐 Starting credential encryption migration...');
    
    // Add encryption key to environment if not present
    if (!process.env.ENCRYPTION_KEY) {
      console.log('⚠️  No ENCRYPTION_KEY found in environment');
      console.log('💡 Add the following to your .env file:');
      const newKey = require('crypto').randomBytes(32).toString('hex');
      console.log(`ENCRYPTION_KEY=${newKey}`);
      console.log('');
      console.log('🛑 Please add this key to your .env file and run the script again');
      process.exit(1);
    }

    // Encrypt OpenAI settings
    const openaiSetting = await Setting.findOne();
    if (openaiSetting && openaiSetting.key && !CredentialEncryption.isEncrypted(openaiSetting.key)) {
      console.log('🔑 Encrypting OpenAI API key...');
      const encrypted = CredentialEncryption.encrypt(openaiSetting.key);
      openaiSetting.key = CredentialEncryption.serialize(encrypted);
      await openaiSetting.save();
      console.log('✅ OpenAI API key encrypted');
    } else if (openaiSetting && CredentialEncryption.isEncrypted(openaiSetting.key)) {
      console.log('✅ OpenAI API key already encrypted');
    }

    // Encrypt Twilio settings
    const twilioSetting = await TwilioSetting.findOne();
    if (twilioSetting) {
      let updated = false;
      
      if (twilioSetting.authToken && !CredentialEncryption.isEncrypted(twilioSetting.authToken)) {
        console.log('🔑 Encrypting Twilio Auth Token...');
        const encrypted = CredentialEncryption.encrypt(twilioSetting.authToken);
        twilioSetting.authToken = CredentialEncryption.serialize(encrypted);
        updated = true;
      }
      
      if (twilioSetting.accountSid && !CredentialEncryption.isEncrypted(twilioSetting.accountSid)) {
        console.log('🔑 Encrypting Twilio Account SID...');
        const encrypted = CredentialEncryption.encrypt(twilioSetting.accountSid);
        twilioSetting.accountSid = CredentialEncryption.serialize(encrypted);
        updated = true;
      }
      
      if (updated) {
        await twilioSetting.save();
        console.log('✅ Twilio credentials encrypted');
      } else {
        console.log('✅ Twilio credentials already encrypted');
      }
    }

    console.log('');
    console.log('🎉 Credential encryption migration completed!');
    console.log('');
    console.log('🔒 Security Benefits:');
    console.log('   • API keys encrypted in database');
    console.log('   • Auth tokens encrypted in database');
    console.log('   • Credentials protected from database exposure');
    console.log('');
    console.log('⚠️  Important Notes:');
    console.log('   • Keep your ENCRYPTION_KEY secret and backed up');
    console.log('   • Don\'t commit ENCRYPTION_KEY to version control');
    console.log('   • Update controllers to use encryption utilities');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during credential encryption:', error);
    process.exit(1);
  }
})();
