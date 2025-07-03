import { Module } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { HubspotController } from './hubspot.controller';
import { ConfigModule } from '@/config/config.module';
// import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [HubspotService],
  controllers: [HubspotController],
  exports: [HubspotService],
})
export class HubspotModule {}
