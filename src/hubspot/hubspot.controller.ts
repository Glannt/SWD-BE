import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('hubspot')
@Controller('hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  /**
   * Tạo mới contact trên Hubspot
   */
  @Post('contact')
  @ApiOperation({ summary: 'Tạo mới contact trên Hubspot' })
  @ApiResponse({ status: 201, description: 'Contact created thành công' })
  @ApiResponse({ status: 400, description: 'Tạo contact thất bại' })
  async createContact(
    @Body() body: { email: string; firstname?: string; lastname?: string },
  ) {
    try {
      return await this.hubspotService.createContact(
        body.email,
        body.firstname,
        body.lastname,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create contact',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
