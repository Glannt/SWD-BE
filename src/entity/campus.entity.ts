import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'campus' })
export class Campus extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  address: string;

  @Prop()
  contactInfo: string;

  @Prop()
  descriptionHighlights: string;
}

export const CampusSchema = SchemaFactory.createForClass(Campus);
