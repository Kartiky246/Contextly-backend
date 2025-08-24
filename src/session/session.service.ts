import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { LangchainService } from 'src/common/langchain/langchain.service';
import { v4 as uuidv4 } from "uuid";


@Injectable()
export class SessionService {
    constructor(@InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
        private readonly cloudinaryService: CloudinaryService, private readonly langchainService: LangchainService){}

    getAllSessions = async (userId: string) =>{
        return this.sessionModel
        .find({userId})
        .sort({createdAt: -1})
        .exec()
    }

    createSession = async (userId: string, data: CreateSessionDto, files: Express.Multer.File[]) => {
        const sessionId = uuidv4();
        let operations: Promise<any>[] = [];
        for(const file of  files){
            operations.push(this.cloudinaryService.uploadFile(file))
        }

        // first upload the files on cloudinary
        const cloudinaryFileLinks = await Promise.all(operations);
        operations = [];
        for(let idx = 0; idx < cloudinaryFileLinks.length; idx++){
            operations.push(this.langchainService.uploadFileInQdrantStore(`uploads/${files[idx].filename}`, userId, sessionId, cloudinaryFileLinks[idx]))
        }
        
        await Promise.all(operations);
        return sessionId;

    }
}
