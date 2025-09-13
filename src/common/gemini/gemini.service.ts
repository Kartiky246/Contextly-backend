import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from "@google/genai";

export enum GeminiModel {
    GEMINI_2_5_FLASH = "gemini-2.5-flash",
    GEMINI_2_0_FLASH_001 = "gemini-2.0-flash",
}

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
