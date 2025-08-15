// Script to populate Twilio settings in the database
import { TwilioSetting } from "../models/index";
import sequelize from "../models/index";

const insertTwilioSettings = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if Twilio settings already exist
    const existingSettings = await TwilioSetting.findOne();
    
    if (existingSettings) {
      console.log('⚠️  Twilio settings already exist:', {
        accountSid: existingSettings.accountSid,
        phoneNumber: existingSettings.phoneNumber,
        hasAuthToken: !!existingSettings.authToken
      });
      
      const shouldUpdate = process.argv.includes('--update');
      if (!shouldUpdate) {
        console.log('🔧 Use --update flag to update existing settings');
        return;
      }
    }

    // Sample Twilio settings - replace with your actual credentials
    const twilioData = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: process.env.TWILIO_AUTH_TOKEN || "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", 
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || "+1234567890",
      optinMessage: 'Your Phone Number has been associated with a FixMyRV.ai service account. To confirm and Opt-In, please respond "YES" to this message. At any moment you can stop all messages from us, by texting back "STOP".'
    };

    // Validate the data
    if (!twilioData.accountSid || twilioData.accountSid.includes('xxx')) {
      console.log('⚠️  Sample data detected. Please update your .env file with real Twilio credentials:');
      console.log('');
      console.log('📝 Required in backend/.env:');
      console.log('TWILIO_ACCOUNT_SID=your_actual_account_sid');
      console.log('TWILIO_AUTH_TOKEN=your_actual_auth_token');
      console.log('TWILIO_PHONE_NUMBER=your_actual_phone_number');
      console.log('');
      console.log('📱 Get these from: https://console.twilio.com/');
      console.log('');
      console.log('⚡ Using sample data for now...');
    }

    let settings;
    if (existingSettings) {
      // Update existing settings
      await existingSettings.update(twilioData);
      settings = existingSettings;
      console.log('🔄 Twilio settings updated');
    } else {
      // Create new settings
      settings = await TwilioSetting.create(twilioData);
      console.log('✅ Twilio settings created');
    }

    console.log('📱 Current Twilio Configuration:');
    console.log(`   Account SID: ${settings.accountSid}`);
    console.log(`   Phone Number: ${settings.phoneNumber}`);
    console.log(`   Auth Token: ${settings.authToken ? '***configured***' : 'NOT SET'}`);
    console.log(`   Opt-In Message: ${settings.optinMessage ? '***configured***' : 'NOT SET'}`);
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Update backend/.env with your real Twilio credentials');
    console.log('2. Go to Admin Settings → Twilio Settings in the web interface');
    console.log('3. Enter your actual Account SID, Auth Token, and Phone Number');
    console.log('4. Test SMS functionality');
    console.log('');
    console.log('🌐 Webhook URL for Twilio Console:');
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com/api/v1/twilio/webhook/sms'
      : 'http://localhost:3000/api/v1/twilio/webhook/sms';
    console.log(`   ${webhookUrl}`);

  } catch (error) {
    console.error('❌ Error setting up Twilio settings:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the script
insertTwilioSettings();
