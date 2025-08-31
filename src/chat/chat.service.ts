import { Injectable } from '@nestjs/common';
import { Chat, ChatDocument, chatMessages, ChatRole } from './chat.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LangchainService } from 'src/common/langchain/langchain.service';
import { ChunkType, streamAiResponse } from 'src/utils/ai/ai-response-stream.utils';
import { OpenAiModel, OpenaiService } from 'src/common/openAi/openai/openai.service';
import { ChatCompletionMessageParam } from 'openai/resources';
import { AI_CHAT_ASSISTANT_SYSTEM_PROMPT } from 'src/utils/prompt/ai-assistant.prompt';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>, private readonly langchainService: LangchainService,
        private readonly openAiService: OpenaiService) { }

    async getChatHistory(sessionId: string, userId: string) {
        return this.chatModel
            .find({ sessionId, userId }, { content: 1, role: 1, _id: 0 })
            .sort({ timeStamp: 1 })
            .lean()
            .exec()
        }
          

    async sendMessageToAi(sessionId: string, userId: string, message: string, onChunk: (type: ChunkType, chunk: string) => void) {
        const chatHistoryPromise = this.getChatHistory(sessionId, userId);
        const context = await this.langchainService.getContext(message, sessionId, userId);
        const history = await chatHistoryPromise;
        const prompt = [this.systemPrompt, ...this.generatePrompt(message, history, context)];
        await streamAiResponse(this.openAiService.client, onChunk, OpenAiModel.GPT_4O_MINI, prompt as ChatCompletionMessageParam[])

    }

    async saveAiMessageInDatabase(messages: { content: string, role: ChatRole }[], userId: string, sessionId: string) {
        await this.chatModel.insertMany(messages.map(v => ({ ...v, sessionId, userId })));
    }

    generatePrompt(message: string, chatHistory: chatMessages, content?: string,) {
        const query =
            `${message}
            ${content ?
                `Answer the question based on following context:
                ${content}`
                : ''}

        `
        if (chatHistory.length) {
            chatHistory.push({ role: ChatRole.USER, content: query });
            return chatHistory;
        }
        return [{ role: ChatRole.USER, content: query }];
    }

    get systemPrompt() {
        return {
          role: ChatRole.SYSTEM,
          content: ` ${AI_CHAT_ASSISTANT_SYSTEM_PROMPT}`,
        };
      }
      
}
