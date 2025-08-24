import { BadRequestException, Body, Controller, Get, Post, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { SessionService } from './session.service';
import type { Response } from 'express';
import { CreateSessionDto } from './dto/create-session.dto';
import { ClerkAuthGuard } from 'src/auth/clerk-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { ReqObj } from 'src/common/types';


@Controller('/api/session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    // @UseGuards(ClerkAuthGuard )
    @Get('/all')
    async getAllSessions(@Req() req: ReqObj, @Res() res: Response) {
        const userId = req?.user?.id! || '1';
        const data = await this.sessionService.getAllSessions(userId);
        return res.status(200).json({ sessons: data })
    }


    // @UseGuards(ClerkAuthGuard )
    @Post('/create')
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
            }),
        }),
    )
    async createSession(@Req() req: ReqObj, @UploadedFiles() files: Express.Multer.File[], @Body() payload, @Res() res) {
        const userId = req?.user?.id! || '1';

        let parsedData: CreateSessionDto;
        try {
            parsedData = JSON.parse(payload.data);
        } catch (err) {
            throw new BadRequestException('Invalid JSON data');
        }

        const dto = plainToInstance(CreateSessionDto, parsedData);

        const errors = await validate(dto);
        if (errors.length > 0) {
            const formattedErrors = errors.map(err => ({
                property: err.property,
                constraints: err.constraints,
            }));
            throw new BadRequestException(formattedErrors);
        }

        const sessionId = await this.sessionService.createSession(userId, parsedData, files)
        return res.status(200).json({ message: 'Session created successfully', sessionId })
    }
}

