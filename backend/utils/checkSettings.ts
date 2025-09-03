import { Setting, TwilioSetting } from '../models/index.js';

(async () => {
  try {
    console.log('🔍 Checking database settings...');
    
    // Check OpenAI settings
    const setting = await Setting.findOne();
    console.log('OpenAI Setting found:', setting ? 'Yes' : 'No');
    if (setting) {
      console.log('OpenAI Setting data:', setting.toJSON());
    } else {
      console.log('❌ No OpenAI setting record exists - this causes "API configuration not found" error');
    }
    
    // Check Twilio settings
    const twilioSetting = await TwilioSetting.findOne();
    console.log('Twilio Setting found:', twilioSetting ? 'Yes' : 'No');
    if (twilioSetting) {
      console.log('Twilio Setting data:', twilioSetting.toJSON());
    } else {
      console.log('❌ No Twilio setting record exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
