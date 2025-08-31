import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import type { ReqObj } from 'src/common/types';
import { ChatService } from './chat.service';
import type { Response } from 'express';
import { ChatRole } from './chat.schema';
import { ClerkAuthGuard } from 'src/auth/clerk-auth.guard';
import { ChunkType } from 'src/utils/ai/ai-response-stream.utils';

@Controller('api/chat')
export class ChatController {
    constructor(private readonly chatService: ChatService){}
    
    @UseGuards(ClerkAuthGuard )
    @Post()
    async postMessage(
      @Req() req: ReqObj,
      @Body() payload: CreateChatDto,
      @Res() res: Response
    ) {
      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("Connection", "keep-alive")
    
      const userId = req?.user?.id!
      let chatResponse = ""
    
      await this.chatService.sendMessageToAi(
        payload.sessionId,
        userId,
        payload.message,
        (type, chunk) => {
          if (type === ChunkType.TEXT) {
            res.write(`data: ${JSON.stringify({ type, value: chunk })}\n\n`)
            chatResponse += chunk
          }
          if (type === ChunkType.LINK) {
            res.write(`data: ${JSON.stringify({ type, value: chunk })}\n\n`)
          }
          if (type === ChunkType.SOURCE) {
            res.write(`data: ${JSON.stringify({ type, value: chunk })}\n\n`)
          }
        }
      )
    
      await this.chatService.saveAiMessageInDatabase(
        [
          { content: payload.message, role: ChatRole.USER },
          { content: chatResponse, role: ChatRole.ASSISTANT },
        ],
        userId,
        payload.sessionId
      )
    
      res.end()
    }
    

    @UseGuards(ClerkAuthGuard )
    @Get('/:sessionId')
    async getAllChat(@Req() req: ReqObj, @Param('sessionId') sessionId: string){
        const userId= req?.user?.id!;
        const chat = await this.chatService.getChatHistory(sessionId, userId )
        return {chat};
    }
}
