import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class GeminiService {
    geminiInstance!: GoogleGenAI;
    constructor(private readonly configService: ConfigService) {}

    get client(){
        if(!this.geminiInstance){
            this.geminiInstance = new GoogleGenAI({
                apiKey: this.configService.get<string>('GEMINI_API_KEY'),
            });
        }
        return this.geminiInstance;
    }
}
