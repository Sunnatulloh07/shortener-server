import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Url extends Document {
  @Prop({ required: true })
  originalUrl: string;

  @Prop({ required: true, unique: true })
  shortUrl: string;

  @Prop({ required: true })
  method: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 0 })
  clickCount: number;

  @Prop({ type: Date, default: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) })
  expiresAt?: Date;

  @Prop({ type: [{ date: Date, ip: String }], default: [] })
  clicks: { date: Date; ip: string }[];
}

export const UrlSchema = SchemaFactory.createForClass(Url);
