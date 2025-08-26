import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema';
import { Contexts, CreateSessionDto, FileTypes } from './dto/create-session.dto';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { LangchainService } from 'src/common/langchain/langchain.service';
import { InternalServerErrorException } from '@nestjs/common';



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
        try {
            let operations: Promise<any>[] = [];
            for(const file of  files){
                operations.push(this.cloudinaryService.uploadFile(file))
            }

            // first upload the files on cloudinary
            const cloudinaryFileLinks = await Promise.all(operations);
            data.context[Contexts.PDF_FILES] = cloudinaryFileLinks.filter((f: {fileType: FileTypes, link: string})=>
                f.fileType === FileTypes.PDF_FILES).map(v=>v.link);

            const sessionDoc = new this.sessionModel({...data,userId});
            const sessionData: SessionDocument = (await sessionDoc.save()).toObject();
            operations = [];
            for(let idx = 0; idx < cloudinaryFileLinks.length; idx++){
                operations.push(this.langchainService.uploadFileInQdrantStore(`uploads/${files[idx].filename}`, userId, sessionData._id as string))
            }
            
            await Promise.all(operations);
            await this.sessionModel.findByIdAndUpdate(
                        sessionData._id,
                        { $set: { isReadyToUse: true } },
                        { new: true }
                    )
                    
            return sessionData._id;
            
        } catch (error) {
            throw new InternalServerErrorException({message: 'something went wrong'})
        }

    }
}
