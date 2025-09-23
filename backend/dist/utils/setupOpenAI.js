import { Setting } from '../models/index.js';
(async () => {
    try {
        console.log('🚀 Creating initial OpenAI settings...');
        // Check if OpenAI settings already exist
        const existingSetting = await Setting.findOne();
        if (existingSetting) {
            console.log('✅ OpenAI settings already exist');
            console.log('Current settings:', existingSetting.toJSON());
            process.exit(0);
        }
        // Create initial OpenAI settings with sample values
        const setting = await Setting.create({
            key: 'sk-your-openai-api-key-here',
            chatModel: 'gpt-4o-mini',
            embeddingModel: 'text-embedding-3-small',
            outputTokens: 1000,
            systemPrompt: 'You are an expert RV repair assistant. Help users with their RV maintenance and repair questions.'
        });
        console.log('✅ OpenAI settings created successfully:');
        console.log('   API Key: ***configured*** (sample key, please update)');
        console.log('   Chat Model:', setting.chatModel);
        console.log('   Embedding Model:', setting.embeddingModel);
        console.log('   Output Tokens:', setting.outputTokens);
        console.log('   System Prompt:', setting.systemPrompt);
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Go to Admin Settings in the web interface');
        console.log('2. Update the OpenAI API key with your real key');
        console.log('3. Adjust models and settings as needed');
        console.log('');
        console.log('💡 Get your OpenAI API key from: https://platform.openai.com/api-keys');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error creating OpenAI settings:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=setupOpenAI.js.map