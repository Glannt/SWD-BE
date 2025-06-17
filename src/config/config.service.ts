import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

@Injectable()
export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor(filePath: string = '.env') {
    if (fs.existsSync(filePath)) {
      this.envConfig = dotenv.parse(fs.readFileSync(filePath));
    } else {
      this.envConfig = process.env as Record<string, string>;
    }
  }

  get(key: string): string {
    return this.envConfig[key] || process.env[key] || '';
  }

  getQdrantApiKey(): string {
    return this.get('QDRANT_API_KEY');
  }

  getQdrantUrl(): string {
    return this.get('QDRANT_URL');
  }

  getGeminiApiKey(): string {
    return this.get('GEMINI_API_KEY');
  }

  getPort(): number {
    return parseInt(this.get('PORT'), 10) || 3000;
  }
}
