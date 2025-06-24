import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Set data in cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    try {
      // Clean up expired entries first
      this.cleanup();
      
      // If cache is too large, remove oldest entries
      if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
        const oldestKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(oldestKey);
      }

      this.memoryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });

      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}ms, Size: ${this.memoryCache.size})`);
    } catch (error) {
      console.warn('⚠️ Cache SET failed:', error.message);
    }
  }

  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.memoryCache.get(key);
      
      if (!entry) {
        console.log(`🔍 Cache MISS: ${key}`);
        return null;
      }

      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        console.log(`⏰ Cache EXPIRED: ${key}`);
        return null;
      }

      console.log(`✅ Cache HIT: ${key}`);
      return entry.data as T;
    } catch (error) {
      console.warn('⚠️ Cache GET failed:', error.message);
      return null;
    }
  }

  /**
   * Check if key exists and is not expired
   * @param key Cache key
   * @returns Boolean indicating if key exists
   */
  has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific cache entry
   * @param key Cache key
   */
  delete(key: string): void {
    const deleted = this.memoryCache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache DELETE: ${key}`);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    console.log(`🧹 Cache CLEAR: ${size} entries removed`);
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧽 Cache CLEANUP: ${removedCount} expired entries removed`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.memoryCache.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }

  /**
   * Create cache key for MongoDB queries
   * @param collection Collection name
   * @param query Query parameters
   * @returns Cache key
   */
  createMongoKey(collection: string, query: any): string {
    const queryString = JSON.stringify(query);
    return `mongo:${collection}:${Buffer.from(queryString).toString('base64').slice(0, 50)}`;
  }

  /**
   * Create cache key for vector searches
   * @param question Question text
   * @param topK Number of results
   * @returns Cache key
   */
  createVectorKey(question: string, topK: number): string {
    const questionHash = Buffer.from(question.toLowerCase().trim()).toString('base64').slice(0, 30);
    return `vector:${questionHash}:k${topK}`;
  }

  /**
   * Create cache key for AI responses
   * @param question Question text
   * @param contextHash Hash of context used
   * @returns Cache key
   */
  createAIKey(question: string, contextHash: string): string {
    const questionHash = Buffer.from(question.toLowerCase().trim()).toString('base64').slice(0, 20);
    return `ai:${questionHash}:${contextHash.slice(0, 20)}`;
  }
} 