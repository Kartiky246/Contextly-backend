// chat.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatDocument = Chat & Document;

export enum ChatRole{
  ASSISTANT = 'assistant',
  USER = 'user'
}

export type chatMessages = {role: ChatRole, content: string} []; 

@Schema({ timestamps: { createdAt: 'timeStamp', updatedAt: false } })
export class Chat {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: ['assistant', 'user'] })
  role: ChatRole;

  @Prop({ required: true })
  sessionId: string;

  @Prop({ required: true })
  userId: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);


ChatSchema.index({ sessionId: 1, userId: 1 });
