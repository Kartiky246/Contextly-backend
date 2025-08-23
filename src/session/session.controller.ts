import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import * as clerkAuthGuard from 'src/auth/clerk-auth.guard';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService){}
    
    @UseGuards(clerkAuthGuard.ClerkAuthGuard)
    @Get()
    async getAllSessions(@Req() req: clerkAuthGuard.ReqObj){
        const userId = req?.user?.id!;
        return this.sessionService.getAllSessions(userId);
    }
}
