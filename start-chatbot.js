#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Environment variables
const envVars = {
  GEMINI_API_KEY: "AIzaSyBxHKg6EIKdQeLRa0sPEQNdvc2GDR5duaE",
  PINECONE_API_KEY: "pcsk_7ACs6N_L5KeAoJhycf6J67t7VkKiukQNQPg8kaF48FS1dVFjswwwUMfg25ETYSKJdroLLw",
  PINECONE_INDEX_NAME: "fpt-university-768d",
  PORT: "3000",
  GLOBAL_PREFIX: "api"
};

// Get mode from command line arguments
const mode = process.argv[2] || 'simple';

console.log('🎯 FPT University Chatbot Launcher');
console.log('=====================================');

// Set environment variables
Object.keys(envVars).forEach(key => {
  process.env[key] = envVars[key];
  console.log(`✅ ${key}: ${envVars[key] ? 'Set' : 'Not Set'}`);
});

console.log('');

if (mode === 'simple') {
  console.log('🚀 Starting Simple Server Mode');
  console.log('📍 Endpoints: /ask, /health');
  console.log('🌐 Frontend Compatible: ✅');
  console.log('');
  
  const child = spawn('pnpm', ['run', 'simple'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...envVars }
  });

  child.on('error', (err) => {
    console.error('❌ Error starting simple server:', err);
  });

} else if (mode === 'nestjs' || mode === 'nest') {
  console.log('🚀 Starting NestJS Mode');
  console.log('📍 Endpoints: /api/chatbot/ask, /ask (compatibility)');
  console.log('🔧 Production Ready: ✅');
  console.log('');
  
  const child = spawn('pnpm', ['run', 'start:dev'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...envVars }
  });

  child.on('error', (err) => {
    console.error('❌ Error starting NestJS server:', err);
  });

} else {
  console.log('❌ Invalid mode. Available modes:');
  console.log('   node start-chatbot.js simple   # Simple server (recommended for development)');
  console.log('   node start-chatbot.js nestjs   # NestJS server (recommended for production)');
  process.exit(1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down chatbot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down chatbot...');
  process.exit(0);
}); 