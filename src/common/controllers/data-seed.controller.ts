import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSeedService } from '../services/data-seed.service';

@Controller('system/data-seed')
@ApiTags('system')
export class DataSeedController {
  constructor(private readonly dataSeedService: DataSeedService) {}

  /**
   * Kiểm tra trạng thái seed dữ liệu
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Check Data Seed Status',
    description: 'Check if database is seeded and view collection counts'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Seed status information'
  })
  async getSeedStatus() {
    const status = await this.dataSeedService.getSeedingStatus();
    return {
      message: status.isSeeded 
        ? 'Database is properly seeded' 
        : 'Database needs seeding',
      status: status.isSeeded ? 'seeded' : 'needs_seeding',
      collections: status.collections,
      lastCheck: status.lastCheck,
      totalRecords: Object.values(status.collections).reduce((sum, count) => sum + count, 0),
    };
  }

  /**
   * Thực hiện seed dữ liệu thủ công
   */
  @Post('seed')
  @ApiOperation({ 
    summary: 'Manual Data Seed',
    description: 'Manually trigger data seeding from JSON files (use with caution)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Seeding completed successfully'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Seeding failed'
  })
  async manualSeed() {
    try {
      await this.dataSeedService.checkAndSeedData();
      const status = await this.dataSeedService.getSeedingStatus();
      
      return {
        message: 'Manual seeding completed successfully',
        status: 'success',
        collections: status.collections,
        totalRecords: Object.values(status.collections).reduce((sum, count) => sum + count, 0),
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Manual seeding failed: ${error.message}`);
    }
  }

  /**
   * Lấy thông tin chi tiết về các file JSON có sẵn
   */
  @Get('files')
  @ApiOperation({ 
    summary: 'Available JSON Files',
    description: 'List available JSON files in documents folder'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Available files information'
  })
  async getAvailableFiles() {
    const fs = require('fs');
    const path = require('path');
    
    const documentsPath = path.join(process.cwd(), 'documents');
    
    try {
      const files = fs.readdirSync(documentsPath)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(documentsPath, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            lastModified: stats.mtime,
            collection: file.replace('FchatCareer.', '').replace('.json', ''),
          };
        });

      return {
        message: 'Available JSON files in documents folder',
        documentsPath,
        files,
        totalFiles: files.length,
      };
    } catch (error) {
      return {
        message: 'Error reading documents folder',
        error: error.message,
        documentsPath,
        files: [],
        totalFiles: 0,
      };
    }
  }
} 