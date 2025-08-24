import { Module } from '@nestjs/common';
import { LangchainService } from './langchain.service';
import { OpenaiModule } from '../openAi/openai/openai.module';
import { QdrantModule } from 'src/qdrant/qdrant.module';

@Module({
  imports: [OpenaiModule, QdrantModule],
  providers: [LangchainService],
  exports: [LangchainService]
})
export class LangchainModule {}
