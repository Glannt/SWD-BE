import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigModule } from '../config/config.module';
import { PineconeService } from './pinecone.service';


@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    PineconeService,
  ],
  exports: [
    PineconeService,
  ],
})
export class PineconeModule {}
