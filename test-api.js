const OpenAI = require('openai');
require('dotenv').config();

async function testAPI() {
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });

  console.log('Testing OpenAI API...\n');

  try {
    // Test chat completion
    console.log('Testing chat completion with gpt-4o-mini...');
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "Hello from Roblox AI Editor!"' }
      ],
      max_tokens: 50
    });
    console.log('✅ Chat completion works:', chatResponse.choices[0].message.content);

    // Test embeddings
    console.log('\nTesting embeddings with text-embedding-3-small...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'Test content for embedding'
    });
    console.log('✅ Embeddings work:', embeddingResponse.data[0].embedding.length, 'dimensions');

    console.log('\n🎉 All tests passed! Your API key is working correctly.');
    console.log('You can now run the Roblox AI Editor.');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.message.includes('insufficient_quota')) {
      console.log('💡 This might be due to insufficient credits on your free plan.');
      console.log('   Check your OpenAI account dashboard for credit status.');
    }
  }
}

testAPI(); 