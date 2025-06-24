#!/usr/bin/env node

/**
 * Test script cho MongoDB integration với chatbot
 * Chạy: node test-mongodb-integration.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Màu sắc cho console
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, url, data = null, description) {
  try {
    log('blue', `\n🔍 Testing: ${description}`);
    log('cyan', `   ${method} ${url}`);
    
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      timeout: 30000,
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    log('green', `   ✅ Success: ${response.status}`);
    
    // Log response size and key info
    const responseText = JSON.stringify(response.data);
    log('cyan', `   📊 Response: ${responseText.length} chars`);
    
    if (response.data.status) {
      log('cyan', `   🏷️  Status: ${response.data.status}`);
    }
    
    return response.data;
  } catch (error) {
    log('red', `   ❌ Failed: ${error.response?.status || error.code}`);
    log('red', `   📝 Error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function runTests() {
  log('magenta', '🚀 Starting MongoDB Integration Tests...');
  log('magenta', '='.repeat(50));
  
  // Test 1: System Status
  const systemStatus = await testEndpoint(
    'GET', 
    '/chatbot/system/status', 
    null, 
    'System Status Check'
  );
  
  // Test 2: Data Statistics
  const dataStats = await testEndpoint(
    'GET', 
    '/chatbot/system/data-stats', 
    null, 
    'MongoDB Data Statistics'
  );
  
  // Test 3: Health Check
  const healthCheck = await testEndpoint(
    'GET', 
    '/chatbot/system/health-check', 
    null, 
    'Comprehensive Health Check'
  );
  
  // Test 4: Debug specific question
  log('blue', '\n🔍 Testing Debug Endpoint...');
  const debugResult = await testEndpoint(
    'GET',
    '/chatbot/system/debug/Ngành%20kỹ%20thuật%20phần%20mềm',
    null,
    'Debug: "Ngành kỹ thuật phần mềm"'
  );
  
  if (debugResult) {
    log('cyan', '   🔍 Debug Analysis:');
    if (debugResult.steps.step1_embeddings?.status === 'success') {
      log('green', '   ✅ Embeddings: Working');
    } else {
      log('red', '   ❌ Embeddings: Failed');
    }
    
    if (debugResult.steps.step2_vectorSearch?.status === 'success') {
      log('green', `   ✅ Vector Search: ${debugResult.steps.step2_vectorSearch.resultsCount} results`);
    } else {
      log('red', '   ❌ Vector Search: Failed');
    }
    
    if (debugResult.steps.step3_mongoQuery?.status === 'success') {
      if (debugResult.steps.step3_mongoQuery.triggered) {
        log('green', `   ✅ MongoDB: Found ${debugResult.steps.step3_mongoQuery.results?.length || 0} results`);
        if (debugResult.steps.step3_mongoQuery.stats) {
          log('cyan', `      - Majors in DB: ${debugResult.steps.step3_mongoQuery.stats.majors}`);
          log('cyan', `      - Campuses in DB: ${debugResult.steps.step3_mongoQuery.stats.campuses}`);
        }
      } else {
        log('yellow', '   ⚠️  MongoDB: Query not triggered');
      }
    } else {
      log('red', '   ❌ MongoDB: Failed');
    }
    
    if (debugResult.steps.step4_fallback?.wouldReturnFallback) {
      log('green', '   ✅ Fallback: Would trigger');
    } else {
      log('yellow', '   ⚠️  Fallback: Would not trigger');
    }
    
    if (debugResult.errors.length > 0) {
      log('red', `   ❌ Errors: ${debugResult.errors.join(', ')}`);
    }
  }
  
  // Test 5: Chatbot Questions
  const testQuestions = [
    'Xin chào',
    'Học phí ngành SE là bao nhiêu?',
    'Thông tin campus Hà Nội',
    'Ngành AI học những gì?',
    'Có học bổng nào không?',
    'Địa chỉ FPT University'
  ];
  
  log('blue', '\n🤖 Testing Chatbot Questions...');
  
  for (const question of testQuestions) {
    const answer = await testEndpoint(
      'POST',
      '/chatbot/ask',
      { question },
      `Chatbot: "${question}"`
    );
    
    if (answer && answer.answer) {
      const answerLength = answer.answer.length;
      log('cyan', `   💬 Answer: ${answerLength} chars`);
      if (answerLength > 100) {
        log('cyan', `   📝 Preview: ${answer.answer.substring(0, 100)}...`);
      } else {
        log('cyan', `   📝 Answer: ${answer.answer}`);
      }
    }
    
    // Small delay between questions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  log('magenta', '\n' + '='.repeat(50));
  log('magenta', '📊 Test Summary:');
  
  if (systemStatus) {
    log('green', `✅ System Status: ${systemStatus.status}`);
    if (systemStatus.services) {
      log('cyan', `   - MongoDB: ${systemStatus.services.mongodb?.status || 'unknown'}`);
      log('cyan', `   - Pinecone: ${systemStatus.services.pinecone?.status || 'unknown'}`);
      log('cyan', `   - Gemini: ${systemStatus.services.gemini?.status || 'unknown'}`);
    }
  } else {
    log('red', '❌ System Status: Failed to fetch');
  }
  
  if (dataStats && dataStats.success) {
    log('green', '✅ MongoDB Data: Available');
    log('cyan', `   - Campuses: ${dataStats.data?.campuses || 0}`);
    log('cyan', `   - Majors: ${dataStats.data?.majors || 0}`);
    log('cyan', `   - Tuition Fees: ${dataStats.data?.tuitionFees || 0}`);
    log('cyan', `   - Scholarships: ${dataStats.data?.scholarships || 0}`);
  } else {
    log('red', '❌ MongoDB Data: No data or connection failed');
  }
  
  if (healthCheck) {
    log('green', `✅ Health Check: ${healthCheck.overall}`);
  } else {
    log('red', '❌ Health Check: Failed');
  }
  
  log('green', '\n🎉 Integration tests completed!');
  log('yellow', '\n💡 Next steps:');
  log('yellow', '1. Check any failed tests above');
  log('yellow', '2. Ensure MongoDB has data if needed');
  log('yellow', '3. Verify API keys are correct');
  log('yellow', '4. Run ingestion if no data: pnpm run ingest:mongodb');
}

// Kiểm tra server có chạy không
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    log('green', '✅ Server is running');
    return true;
  } catch (error) {
    log('red', '❌ Server is not running or not accessible');
    log('yellow', '💡 Please start the server first: pnpm start:dev');
    return false;
  }
}

// Main execution
async function main() {
  log('cyan', '🔧 FPT University Chatbot MongoDB Integration Test');
  log('cyan', '🌐 Testing server at: ' + BASE_URL);
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await runTests();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log('red', '❌ Unhandled error: ' + error.message);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  log('red', '❌ Test execution failed: ' + error.message);
  process.exit(1);
}); 