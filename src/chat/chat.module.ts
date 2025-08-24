import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './chat.schema';
import { LangchainModule } from 'src/common/langchain/langchain.module';
import { OpenaiModule } from 'src/common/openAi/openai/openai.module';

@Module({
  imports:[
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]), LangchainModule, OpenaiModule
  ],
  providers: [ChatService],
  controllers: [ChatController]
})
export class ChatModule {}
