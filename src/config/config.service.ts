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
    console.log(
      '- GEMINI_API_KEY:',
      this.getGeminiApiKey() ? '✅ Configured' : '❌ Missing',
    );
    console.log(
      '- PINECONE_API_KEY:',
      this.getPineconeApiKey() ? '✅ Configured' : '❌ Missing',
    );
    console.log(
      '- PINECONE_INDEX_NAME:',
      this.getPineconeIndexName() || 'Not set',
    );
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
  getJwtSecret(): string {
    return this.get('JWT_SECRET') || 'default-jwt-secret';
  }

  getJwtAccessSecret(): string {
    return this.get('JWT_ACCESS_TOKEN_SECRET') || 'default-access-secret';
  }

  getJwtRefreshSecret(): string {
    return this.get('JWT_REFRESH_TOKEN_SECRET') || 'default-refresh-secret';
  }

  getJwtAccessExpire(): string {
    return this.get('JWT_ACCESS_EXPIRE') || '900000';
  }

  getJwtRefreshExpire(): string {
    return this.get('JWT_REFRESH_EXPIRE') || '86400000';
  }

  // Redis Configuration
  getRedisUrl(): string {
    return this.get('REDIS_URL') || 'redis://localhost:6379';
  }

  getRedisHost(): string {
    return this.get('REDIS_HOST') || 'localhost';
  }

  getRedisPort(): number {
    return parseInt(this.get('REDIS_PORT'), 10) || 6379;
  }

  // Mail Configuration
  getMailHost(): string {
    return this.get('MAIL_HOST') || '';
  }

  getMailPort(): number {
    return parseInt(this.get('MAIL_PORT'), 10) || 2525;
  }

  getMailUser(): string {
    return this.get('MAIL_USER') || '';
  }

  getMailPass(): string {
    return this.get('MAIL_PASS') || '';
  }

  getMailFrom(): string {
    return this.get('MAIL_FROM') || '';
  }

  // Environment
  getNodeEnv(): string {
    return this.get('NODE_ENV') || 'development';
  }

  getHubspotApiKey(): string {
    return this.get('HUBSPOT_API_KEY');
  }
}
