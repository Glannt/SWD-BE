import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campus } from '../entity/campus.entity';

@Injectable()
export class CampusService {
  constructor(
    @InjectModel(Campus.name) private readonly campusModel: Model<Campus>,
  ) {}

  // async findCampusIdByName(name: string){
  //   const campus = this.campusModel.findOne({name: name});
  //   return {campus_id: campus.campus_id};
  // }
}
