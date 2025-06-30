import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HubspotService } from './hubspot.service';

@Controller('hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  @Post('contact')
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
