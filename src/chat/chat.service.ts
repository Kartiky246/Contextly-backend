import { Injectable } from '@nestjs/common';
import { Chat, ChatDocument, chatMessages, ChatRole } from './chat.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LangchainService } from 'src/common/langchain/langchain.service';
import { ChunkType, streamAiResponse } from 'src/utils/ai/ai-response-stream.utils';
import { OpenAiModel, OpenaiService } from 'src/common/openAi/openai/openai.service';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>, private readonly langchainService: LangchainService,
        private readonly openAiService: OpenaiService) { }

    async getChatHistory(sessionId: string, userId: string) {
        return this.chatModel
            .find({ sessionId, userId })
            .sort({ timeStamp: 1 })
            .lean()
            .exec();
    }


    async sendMessageToAi(sessionId: string, userId: string, message: string, onChunk: (type: ChunkType, chunk: string) => void) {
        const preRequisteDataForChat = await Promise.all([this.getChatHistory(sessionId, userId), this.langchainService.getRelevantContent(message, sessionId, userId)])
        const prompt = [this.systemPrompt, ...this.generatePrompt(message, preRequisteDataForChat[1], preRequisteDataForChat[0])];
        await streamAiResponse(this.openAiService.client, onChunk, OpenAiModel.GPT_4O_MINI, prompt as ChatCompletionMessageParam[])

    }

    async saveAiMessageInDatabase(messages: { content: string, role: ChatRole }[], userId: string, sessionId: string) {
        await this.chatModel.insertMany(messages.map(v => ({ ...v, sessionId, userId })));
    }

    generatePrompt(message: string, content: string, chatHistory: chatMessages) {
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
          content: `
            You are an AI assistant that helps users resolve their queries.
            RULES:
                1) Always answer with respect to provided context.
                2) If no context message is provided, say: "I am not able to retrieve any info based on the context that you provided earlier."
                3) For greetings, reply politely and ask how you can help.
                4) If your answer includes a link, **always wrap it with <LinkStart> and </LinkEnd>** exactly.
                5) If the context provided have source of content always send it in the end. **always wrap it with <sourceStart> and </sourceEnd>**.
                5) Do not use these tags for anything else.
          `,
        };
      }
      
}
