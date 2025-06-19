import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

@Injectable()
export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor(filePath: string = '.env') {
    // Load from file first, then fallback to process.env
    if (fs.existsSync(filePath)) {
      const fileConfig = dotenv.parse(fs.readFileSync(filePath));
      this.envConfig = { ...process.env, ...fileConfig };
    } else {
      this.envConfig = process.env as Record<string, string>;
    }
    
    // Debug logging
    console.log('🔧 ConfigService loaded:');
    console.log('- GEMINI_API_KEY:', this.getGeminiApiKey() ? '✅ Configured' : '❌ Missing');
    console.log('- PINECONE_API_KEY:', this.getPineconeApiKey() ? '✅ Configured' : '❌ Missing');
    console.log('- PINECONE_INDEX_NAME:', this.getPineconeIndexName() || 'Not set');
  }

  get(key: string): string {
    return this.envConfig[key] || '';
  }

  // Chatbot Configuration
  getGeminiApiKey(): string {
    return this.get('GEMINI_API_KEY');
  }

  getPineconeApiKey(): string {
    return this.get('PINECONE_API_KEY');
  }

  getPineconeIndexName(): string {
    return this.get('PINECONE_INDEX_NAME');
  }

  getPineconeEnvironment(): string {
    return this.get('PINECONE_ENVIRONMENT');
  }

  // Server Configuration
  getPort(): number {
    return parseInt(this.get('PORT'), 10) || 3000;
  }

  getGlobalPrefix(): string {
    return this.get('GLOBAL_PREFIX') || 'api';
  }



  // Database Configuration
  getMongoUri(): string {
    return this.get('MONGODB_URI') || 'mongodb://localhost:27017/fpt-chatbot';
  }

  // JWT Configuration
  getJwtAccessSecret(): string {
    return this.get('JWT_ACCESS_TOKEN_SECRET') || 'default-secret';
  }

  getJwtAccessExpire(): string {
    return this.get('JWT_ACCESS_EXPIRE') || '900000';
  }

  // Redis Configuration
  getRedisUrl(): string {
    return this.get('REDIS_URL') || 'redis://localhost:6379';
  }
}
