import {OpenAIEmbeddings } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export enum OpenAiModel {
  GPT_4O = "gpt-4o",
  GPT_4O_MINI = "gpt-4o-mini",
  TEXT_EMBEDDING_3_SMALL = "text-embedding-3-small"
}

@Injectable()
export class OpenaiService {
    openAiEmbeddings!: OpenAIEmbeddings;
    openAiInstance!: OpenAI;
    constructor(private readonly configService: ConfigService) { }

    get embedding() {
        if (!this.openAiEmbeddings) {
            this.openAiEmbeddings = new OpenAIEmbeddings({
                model: OpenAiModel.TEXT_EMBEDDING_3_SMALL,
                apiKey: this.configService.get<string>('OPEN_AI_API_KEY')
            });
        }
        return this.openAiEmbeddings;
    }

    get client(){
        if(!this.openAiInstance){
            this.openAiInstance = new OpenAI({
                apiKey: this.configService.get<string>('OPEN_AI_API_KEY')
            })
        }
        return this.openAiInstance;
    }
}
