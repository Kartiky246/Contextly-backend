import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import type { ReqObj } from 'src/common/types';
import { ChatService } from './chat.service';
import type { Response } from 'express';

@Controller('api/chat')
export class ChatController {
    constructor(private readonly chatService: ChatService){}

    @Post()
    async postMessage(@Req() req: ReqObj, @Body() payload: CreateChatDto, @Res() res: Response){
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        const userId = req?.user?.id! || '1'
        await this.chatService.sendMessage(payload.sessionId, userId, payload.message, (chunk)=>{
            res.write(`data: ${chunk}\n\n`);
        })
        res.end();
    }
}
