import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema';
import { Contexts, CreateSessionDto } from './dto/create-session.dto';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class SessionService {
    constructor(@InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
        private readonly cloudinaryService: CloudinaryService){}

    getAllSessions = async (userId: string) =>{
        return this.sessionModel
        .find({userId})
        .sort({createdAt: -1})
        .exec()
    }

    createSession = async (userId: string, data: CreateSessionDto, files: Express.Multer.File[]) => {
        const operations: Promise<any>[] = [];
        for(const file of  files){
            operations.push(this.cloudinaryService.uploadFile(file))
        }
        var a = await Promise.all(operations);
        var c = a;

    }
}
