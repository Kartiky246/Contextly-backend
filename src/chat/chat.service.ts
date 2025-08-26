import { Injectable } from '@nestjs/common';
import { Chat, ChatDocument, chatMessages, ChatRole } from './chat.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LangchainService } from 'src/common/langchain/langchain.service';
import { streamAiResponse } from 'src/utils/ai/ai-response-stream.utils';
import { OpenAiModel, OpenaiService } from 'src/common/openAi/openai/openai.service';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>, private readonly langchainService: LangchainService,
    private readonly openAiService: OpenaiService){}

    async getChatHistory(sessionId: string, userId: string){
        return this.chatModel.find({ sessionId, userId  }).sort({ timeStamp: 1 }).exec()
    }

    async sendMessageToAi(sessionId: string, userId: string, message: string, onChunk: (chunk: string) => void){
        const preRequisteDataForChat = await Promise.all([this.getChatHistory(sessionId, userId), this.langchainService.getRelevantContent(message, sessionId, userId)])
        const prompt = this.generatePrompt(message, preRequisteDataForChat[1], preRequisteDataForChat[0]);
        await streamAiResponse(this.openAiService.client, onChunk, OpenAiModel.GPT_4O_MINI, prompt as ChatCompletionMessageParam[] )
        
    }

    async saveAiMessageInDatabase(messages: {content: string, role: ChatRole}[], userId: string, sessionId: string){
        await this.chatModel.insertMany(messages.map(v=>({...v, sessionId, userId})));
    }

    generatePrompt(message: string, content: string [], chatHistory: chatMessages){
        const query = 
        `${message}
            ${content.length ?
                `Answer the question based on following data:
                ${content.reduce((acc,curr)=> (acc + curr + ','),'')}`
            : ''}

        `
        if(chatHistory.length){
            chatHistory.push({role: ChatRole.USER, content: query});
            return chatHistory;
        }
        return [{role: ChatRole.USER, content: query}];
    }
}
