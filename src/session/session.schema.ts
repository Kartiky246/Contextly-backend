// sessions/schemas/session.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: false })
  isReadyToUse: boolean;

  @Prop({
    type: Object,
    default: {
      docs: [],
      csvFiles: [],
      pdfFiles: [],
      youtubeLinks: [],
      websiteLinks: [],
    },
  })
  context: {
    docs: string[];
    csvFiles: string[];
    pdfFiles: string[];
    youtubeLinks: string[];
    websiteLinks: string[];
  };
}

export const SessionSchema = SchemaFactory.createForClass(Session);
