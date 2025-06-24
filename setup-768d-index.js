const { Pinecone } = require('@pinecone-database/pinecone');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function setupPineconeIndex() {
  console.log('🚀 Setting up Pinecone index...');
  
  // Get API key from environment
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME || 'fpt-university-768d';
  
  if (!apiKey) {
    console.error('❌ PINECONE_API_KEY is required in .env file');
    process.exit(1);
  }
  
  console.log('📋 Configuration:');
  console.log('- API Key:', apiKey.substring(0, 10) + '...');
  console.log('- Index Name:', indexName);
  
  try {
    // Initialize Pinecone
    const pc = new Pinecone({ apiKey });
    
    // Check if index already exists
    console.log('🔍 Checking existing indexes...');
    const indexes = await pc.listIndexes();
    const indexNames = indexes.indexes?.map(index => index.name) || [];
    
    if (indexNames.includes(indexName)) {
      console.log(`✅ Index '${indexName}' already exists!`);
      
      // Get index stats
      const index = pc.index(indexName);
      const stats = await index.describeIndexStats();
      console.log('📊 Index stats:');
      console.log('- Total vectors:', stats.totalVectorCount || 0);
      console.log('- Dimension:', stats.dimension || 'unknown');
      console.log('- Index fullness:', stats.indexFullness || 0);
      
      console.log('\n🎉 Pinecone setup complete!');
      console.log('📝 Next steps:');
      console.log('1. Run: pnpm run ingest');
      console.log('2. Run: pnpm run simple');
      console.log('3. Open: http://localhost:3000');
      return;
    }
    
    // Create new index
    console.log(`🔧 Creating new index: ${indexName}`);
    
    await pc.createIndex({
      name: indexName,
      dimension: 768, // Gemini text-embedding-004 dimension
      metric: 'cosine',
      spec: {
        pod: {
          environment: 'gcp-starter',
          podType: 'p1.x1'
        }
      }
    });
    
    console.log('⏳ Waiting for index to be ready...');
    
    // Wait for index to be ready
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!isReady && attempts < maxAttempts) {
      try {
        const index = pc.index(indexName);
        const stats = await index.describeIndexStats();
        isReady = true;
        console.log(`✅ Index '${indexName}' is ready!`);
        console.log('📊 Index details:');
        console.log('- Dimension:', stats.dimension);
        console.log('- Total vectors:', stats.totalVectorCount || 0);
      } catch (error) {
        attempts++;
        console.log(`⏳ Attempt ${attempts}/${maxAttempts} - Index not ready yet...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!isReady) {
      throw new Error('Index creation timeout');
    }
    
    console.log('\n🎉 Pinecone index setup complete!');
    console.log('📝 Next steps:');
    console.log('1. Run: pnpm run ingest');
    console.log('2. Run: pnpm run simple');
    console.log('3. Open: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error setting up Pinecone:', error);
    
    if (error.message.includes('Invalid API key')) {
      console.error('💡 Please check your PINECONE_API_KEY in .env file');
    } else if (error.message.includes('quota')) {
      console.error('💡 You may have reached your Pinecone quota limit');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupPineconeIndex(); 