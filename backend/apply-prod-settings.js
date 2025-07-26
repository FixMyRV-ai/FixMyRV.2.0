import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function applyProdSettingsToLocal() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rvchat',
    password: 'azzan945',
    port: 5432,
  });

  try {
    console.log('🏠 Connecting to local database...');
    await client.connect();
    console.log('✅ Connected to local database');

    // Production settings from CSV
    const prodSettings = {
      id: 1,
      api_key: 'YOUR_OPENAI_API_KEY_HERE',
      chat_model: 'o3',
      embedding_model: 'text-embedding-3-large',
      output_tokens: 2000,
      created_at: '2025-04-09 14:16:58.554+00',
      updated_at: '2025-07-04 16:36:06.727+00'
    };

    console.log('\n📋 Production settings to apply:');
    console.log(`  - API Key: ${prodSettings.api_key.substring(0, 15)}...${prodSettings.api_key.slice(-6)} ✅`);
    console.log(`  - Chat Model: ${prodSettings.chat_model}`);
    console.log(`  - Embedding Model: ${prodSettings.embedding_model}`);
    console.log(`  - Output Tokens: ${prodSettings.output_tokens}`);

    // Check if local settings exist
    const existingResult = await client.query('SELECT id FROM settings LIMIT 1');
    
    if (existingResult.rows.length > 0) {
      // Update existing settings
      console.log('\n🔄 Updating existing local settings...');
      await client.query(`
        UPDATE settings 
        SET 
          key = $1,
          "chatModel" = $2,
          "embeddingModel" = $3,
          "outputTokens" = $4,
          "updatedAt" = NOW()
        WHERE id = $5
      `, [
        prodSettings.api_key,
        prodSettings.chat_model,
        prodSettings.embedding_model,
        prodSettings.output_tokens,
        existingResult.rows[0].id
      ]);
      console.log('✅ Local settings updated successfully');
    } else {
      // Create new settings (with system prompt from our previous setup)
      console.log('\n➕ Creating new local settings...');
      const systemPrompt = `You are FixMyRV AI, an expert assistant for RV (Recreational Vehicle) repair, maintenance, and troubleshooting. 

You help RV owners with:
- Diagnosing mechanical and electrical problems
- Providing step-by-step repair instructions
- Recommending maintenance schedules
- Suggesting appropriate tools and parts
- Safety considerations for RV repairs
- Troubleshooting heating, cooling, plumbing, and electrical systems

Always prioritize safety and recommend professional help for complex or dangerous repairs. Provide clear, practical advice based on the uploaded RV manuals and documentation.`;

      await client.query(`
        INSERT INTO settings (key, "chatModel", "embeddingModel", "outputTokens", "systemPrompt", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        prodSettings.api_key,
        prodSettings.chat_model,
        prodSettings.embedding_model,
        prodSettings.output_tokens,
        systemPrompt
      ]);
      console.log('✅ Local settings created successfully');
    }

    // Verify the settings were applied
    console.log('\n🔍 Verifying local settings...');
    const verifyResult = await client.query(`
      SELECT 
        id,
        key as api_key,
        "chatModel" as chat_model,
        "embeddingModel" as embedding_model,
        "outputTokens" as output_tokens,
        "updatedAt" as updated_at
      FROM settings 
      ORDER BY id DESC 
      LIMIT 1;
    `);

    if (verifyResult.rows.length > 0) {
      const localSettings = verifyResult.rows[0];
      console.log('\n✅ Local Settings Verification:');
      console.log(`  - ID: ${localSettings.id}`);
      console.log(`  - API Key: ${localSettings.api_key === prodSettings.api_key ? '✅ Matches Production' : '❌ Different from Production'}`);
      console.log(`  - Chat Model: ${localSettings.chat_model} ${localSettings.chat_model === prodSettings.chat_model ? '✅' : '❌'}`);
      console.log(`  - Embedding Model: ${localSettings.embedding_model} ${localSettings.embedding_model === prodSettings.embedding_model ? '✅' : '❌'}`);
      console.log(`  - Output Tokens: ${localSettings.output_tokens} ${localSettings.output_tokens === prodSettings.output_tokens ? '✅' : '❌'}`);
      console.log(`  - Updated: ${localSettings.updated_at}`);
    }

    await client.end();
    console.log('\n🎉 Production settings successfully applied to local database!');
    console.log('\n🚀 Next steps:');
    console.log('1. Your local app now has the same OpenAI configuration as production');
    console.log('2. Test the AI chat functionality in your local app');
    console.log('3. Upload some RV documents to test the enhanced responses');

  } catch (error) {
    console.error('❌ Failed to apply settings:', error.message);
    console.error('Full error:', error);
  }
}

applyProdSettingsToLocal();
