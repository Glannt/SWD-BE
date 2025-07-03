import { Injectable } from '@nestjs/common';
import { Client } from '@hubspot/api-client';
import { ConfigService } from '../config/config.service';

@Injectable()
export class HubspotService {
  private readonly hubspotClient: Client;

  constructor(private readonly configService: ConfigService) {
    this.hubspotClient = new Client({
      accessToken: this.configService.getHubspotApiKey(),
    });
  }

  async createContact(email: string, firstname?: string, lastname?: string) {
    const response = await this.hubspotClient.crm.contacts.basicApi.create({
      properties: {
        email,
        firstname,
        lastname,
      },
    });
    return response;
  }
}
