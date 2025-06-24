import { Module } from '@nestjs/common';
import { CampusService } from './campus.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Campus, CampusSchema } from '../entity/campus.entity';

@Module({
  imports: [ MongooseModule.forFeature([
    { name: Campus.name, schema: CampusSchema }
  ]),
],
  providers: [CampusService]
})
export class CampusModule {}
