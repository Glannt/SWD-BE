import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MongoDbDataService } from '../services/mongodb-data.service';
import { PineconeService } from '../services/pinecone.service';
import { GeminiService } from '../services/gemini.service';

@Controller('chatbot/system')
@ApiTags('chatbot-system')
export class SystemController {
  constructor(
    private readonly mongoDbDataService: MongoDbDataService,
    private readonly pineconeService: PineconeService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Kiểm tra trạng thái hệ thống chatbot
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Check Chatbot System Status',
    description: 'Get the current status of all chatbot components: MongoDB, Pinecone, and Gemini AI'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System status information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        services: {
          type: 'object',
          properties: {
            mongodb: { type: 'object' },
            pinecone: { type: 'object' },
            gemini: { type: 'object' }
          }
        },
        data: { type: 'object' }
      }
    }
  })
  async getSystemStatus() {
    const timestamp = new Date().toISOString();
    const status = {
      status: 'checking',
      timestamp,
      services: {
        mongodb: { status: 'unknown', error: null, stats: null },
        pinecone: { status: 'unknown', error: null },
        gemini: { status: 'unknown', error: null }
      },
      data: null
    };

    // Test MongoDB connection
    try {
      const stats = await this.mongoDbDataService.getDataStatistics();
      status.services.mongodb = {
        status: 'healthy',
        error: null,
        stats
      };
      status.data = stats;
    } catch (error) {
      status.services.mongodb = {
        status: 'error',
        error: error.message,
        stats: null
      };
    }

    // Test Pinecone connection
    try {
      await this.pineconeService.getIndex();
      status.services.pinecone = {
        status: 'healthy',
        error: null
      };
    } catch (error) {
      status.services.pinecone = {
        status: 'error',
        error: error.message
      };
    }

    // Test Gemini AI
    try {
      await this.geminiService.createEmbedding('test');
      status.services.gemini = {
        status: 'healthy',
        error: null
      };
    } catch (error) {
      status.services.gemini = {
        status: 'error',
        error: error.message
      };
    }

    // Determine overall status
    const allHealthy = Object.values(status.services).every(service => service.status === 'healthy');
    const anyHealthy = Object.values(status.services).some(service => service.status === 'healthy');
    
    if (allHealthy) {
      status.status = 'healthy';
    } else if (anyHealthy) {
      status.status = 'partial';
    } else {
      status.status = 'error';
    }

    return status;
  }

  /**
   * Lấy thống kê chi tiết từ MongoDB
   */
  @Get('data-stats')
  @ApiOperation({ 
    summary: 'Get MongoDB Data Statistics',
    description: 'Get detailed statistics about data stored in MongoDB'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'MongoDB data statistics'
  })
  async getDataStatistics() {
    try {
      const stats = await this.mongoDbDataService.getDataStatistics();
      return {
        success: true,
        timestamp: new Date().toISOString(),
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Test kết nối với tất cả services
   */
  @Get('health-check')
  @ApiOperation({ 
    summary: 'Comprehensive Health Check',
    description: 'Perform comprehensive health check of all services with detailed testing'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed health check results'
  })
  async healthCheck() {
    const timestamp = new Date().toISOString();
    const results = {
      timestamp,
      overall: 'checking',
      tests: {
        mongodb: null,
        pinecone: null,
        gemini: null,
        integration: null
      }
    };

    // Test MongoDB
    console.log('🔍 Testing MongoDB connection...');
    try {
      const stats = await this.mongoDbDataService.getDataStatistics();
      results.tests.mongodb = {
        status: 'pass',
        message: 'MongoDB connection successful',
        data: stats,
        duration: Date.now()
      };
      console.log('✅ MongoDB test passed');
    } catch (error) {
      results.tests.mongodb = {
        status: 'fail',
        message: 'MongoDB connection failed',
        error: error.message,
        duration: Date.now()
      };
      console.log('❌ MongoDB test failed:', error.message);
    }

    // Test Pinecone
    console.log('🔍 Testing Pinecone connection...');
    try {
      const index = await this.pineconeService.getIndex();
      const testVector = Array(768).fill(0).map(() => Math.random() - 0.5);
      await this.pineconeService.queryVectors(testVector, 1);
      results.tests.pinecone = {
        status: 'pass',
        message: 'Pinecone connection and query successful',
        duration: Date.now()
      };
      console.log('✅ Pinecone test passed');
    } catch (error) {
      results.tests.pinecone = {
        status: 'fail',
        message: 'Pinecone connection or query failed',
        error: error.message,
        duration: Date.now()
      };
      console.log('❌ Pinecone test failed:', error.message);
    }

    // Test Gemini AI
    console.log('🔍 Testing Gemini AI...');
    try {
      const embedding = await this.geminiService.createEmbedding('Test embedding for health check');
      const answer = await this.geminiService.generateAnswer('FPT University là gì?', 'Test context');
      results.tests.gemini = {
        status: 'pass',
        message: 'Gemini AI embedding and generation successful',
        embeddingDimension: embedding.length,
        answerLength: answer.length,
        duration: Date.now()
      };
      console.log('✅ Gemini AI test passed');
    } catch (error) {
      results.tests.gemini = {
        status: 'fail',
        message: 'Gemini AI failed',
        error: error.message,
        duration: Date.now()
      };
      console.log('❌ Gemini AI test failed:', error.message);
    }

    // Test integration (if all previous tests passed)
    if (results.tests.mongodb?.status === 'pass' && 
        results.tests.pinecone?.status === 'pass' && 
        results.tests.gemini?.status === 'pass') {
      console.log('🔍 Testing full integration...');
      try {
        // Test getting data from MongoDB and creating embeddings
        const chunks = await this.mongoDbDataService.getAllDataAsChunks();
        if (chunks.length > 0) {
          const testEmbedding = await this.geminiService.createEmbedding(chunks[0].text);
          results.tests.integration = {
            status: 'pass',
            message: 'Full integration test successful',
            chunksFound: chunks.length,
            embeddingCreated: testEmbedding.length,
            duration: Date.now()
          };
          console.log('✅ Integration test passed');
        } else {
          results.tests.integration = {
            status: 'warning',
            message: 'Integration works but no data found in MongoDB',
            duration: Date.now()
          };
          console.log('⚠️ Integration test warning: no data');
        }
      } catch (error) {
        results.tests.integration = {
          status: 'fail',
          message: 'Integration test failed',
          error: error.message,
          duration: Date.now()
        };
        console.log('❌ Integration test failed:', error.message);
      }
    } else {
      results.tests.integration = {
        status: 'skip',
        message: 'Integration test skipped due to individual service failures'
      };
    }

    // Determine overall status
    const testResults = Object.values(results.tests);
    const allPass = testResults.every(test => test?.status === 'pass');
    const anyFail = testResults.some(test => test?.status === 'fail');
    
    if (allPass) {
      results.overall = 'healthy';
    } else if (anyFail) {
      results.overall = 'unhealthy';
    } else {
      results.overall = 'partial';
    }

    return results;
  }

  /**
   * Debug endpoint để test từng bước xử lý câu hỏi
   */
  @Get('debug/:question')
  @ApiOperation({ 
    summary: 'Debug Question Processing',
    description: 'Debug step-by-step question processing to identify issues'
  })
  async debugQuestion(@Param('question') question: string) {
    const timestamp = new Date().toISOString();
    const debug = {
      timestamp,
      question: decodeURIComponent(question),
      steps: {
        step1_embeddings: null,
        step2_vectorSearch: null,
        step3_mongoQuery: null,
        step4_fallback: null
      },
      errors: []
    };

    try {
      // Step 1: Test Gemini embedding
      console.log('🔍 Debug Step 1: Testing Gemini embeddings...');
      try {
        const embedding = await this.geminiService.createEmbedding(debug.question);
        debug.steps.step1_embeddings = {
          status: 'success',
          dimension: embedding.length,
          sample: embedding.slice(0, 5)
        };
      } catch (error) {
        debug.steps.step1_embeddings = {
          status: 'error',
          error: error.message
        };
        debug.errors.push('Gemini embedding failed');
      }

      // Step 2: Test vector search
      console.log('🔍 Debug Step 2: Testing vector search...');
      try {
        if (debug.steps.step1_embeddings?.status === 'success') {
          const embedding = await this.geminiService.createEmbedding(debug.question);
          const results = await this.pineconeService.queryVectors(embedding, 3);
          debug.steps.step2_vectorSearch = {
            status: 'success',
            resultsCount: results?.length || 0,
            results: results?.map(r => ({
              score: r.score,
              metadata: {
                type: r.metadata?.type,
                source: r.metadata?.source,
                                 textPreview: typeof r.metadata?.text === 'string' ? r.metadata.text.substring(0, 100) : 'N/A'
              }
            }))
          };
        } else {
          debug.steps.step2_vectorSearch = {
            status: 'skipped',
            reason: 'Embedding failed'
          };
        }
      } catch (error) {
        debug.steps.step2_vectorSearch = {
          status: 'error',
          error: error.message
        };
        debug.errors.push('Vector search failed');
      }

      // Step 3: Test MongoDB query
      console.log('🔍 Debug Step 3: Testing MongoDB query...');
      try {
        // Check if question triggers MongoDB logic
        const lowerQuestion = debug.question.toLowerCase();
        const triggersMongoDb = 
          lowerQuestion.includes('ngành') || lowerQuestion.includes('kỹ thuật') || 
          lowerQuestion.includes('phần mềm') || lowerQuestion.includes('campus') ||
          lowerQuestion.includes('học phí');

        if (triggersMongoDb) {
          const stats = await this.mongoDbDataService.getDataStatistics();
          
          // Test specific queries based on question
          let mongoResults = [];
          
          if (lowerQuestion.includes('phần mềm') || lowerQuestion.includes('kỹ thuật')) {
            const major = await this.mongoDbDataService.getMajorByCodeOrName('phần mềm');
            if (major) {
              mongoResults.push({ type: 'major', data: major });
            }
          }
          
          debug.steps.step3_mongoQuery = {
            status: 'success',
            triggered: true,
            stats,
            results: mongoResults,
            queryKeywords: lowerQuestion.match(/ngành|kỹ thuật|phần mềm|campus|học phí/g)
          };
        } else {
          debug.steps.step3_mongoQuery = {
            status: 'success',
            triggered: false,
            reason: 'Question does not match MongoDB patterns'
          };
        }
      } catch (error) {
        debug.steps.step3_mongoQuery = {
          status: 'error',
          error: error.message
        };
        debug.errors.push('MongoDB query failed');
      }

      // Step 4: Test fallback
      console.log('🔍 Debug Step 4: Testing fallback...');
      try {
        const lowerQuestion = debug.question.toLowerCase();
        let fallbackTriggered = false;
        
        if (lowerQuestion.includes('ngành') || lowerQuestion.includes('kỹ thuật') || 
            lowerQuestion.includes('phần mềm')) {
          fallbackTriggered = true;
        }
        
        debug.steps.step4_fallback = {
          status: 'success',
          triggered: fallbackTriggered,
          patterns: lowerQuestion.match(/ngành|kỹ thuật|phần mềm|học phí|campus/g),
          wouldReturnFallback: fallbackTriggered
        };
      } catch (error) {
        debug.steps.step4_fallback = {
          status: 'error',
          error: error.message
        };
        debug.errors.push('Fallback logic failed');
      }

    } catch (error) {
      debug.errors.push(`General error: ${error.message}`);
    }

    return debug;
  }

  /**
   * Test Campus Discounts Entity
   */
  @Get('test-campus-discounts')
  @ApiOperation({ 
    summary: 'Test Campus Discounts Entity',
    description: 'Test if campus discounts entity matches MongoDB data structure'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Campus discounts test results'
  })
  async testCampusDiscounts() {
    try {
      console.log('🧪 Testing Campus Discounts entity...');
      const result = await this.mongoDbDataService.testCampusDiscounts();
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Campus discounts test completed',
        data: result,
        count: result.length
      };
    } catch (error) {
      console.error('❌ Campus discounts test failed:', error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        message: 'Campus discounts test failed',
        error: error.message,
        data: null,
        count: 0
      };
    }
  }

  /**
   * Export Database Structure - Lấy toàn bộ cấu trúc và dữ liệu mẫu từ MongoDB
   */
  @Get('export-database-structure')
  @ApiOperation({ 
    summary: 'Export Database Structure',
    description: 'Export all collections structure and sample data from MongoDB'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Database structure and sample data'
  })
  async exportDatabaseStructure() {
    try {
      console.log('📤 Exporting MongoDB database structure...');
      const result = await this.mongoDbDataService.exportAllCollections();
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Database structure exported successfully',
        database: 'FchatCareer',
        collections: result
      };
    } catch (error) {
      console.error('❌ Database export failed:', error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        message: 'Database export failed',
        error: error.message,
        database: 'FchatCareer',
        collections: null
      };
    }
  }
} 