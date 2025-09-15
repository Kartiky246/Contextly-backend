import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema';
import { Contexts, CreateSessionDto, FileTypes } from './dto/create-session.dto';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { LangchainService } from 'src/common/langchain/langchain.service';
import { InternalServerErrorException } from '@nestjs/common';
import { ScrapedContent, scrapeWebsite } from 'src/utils/web-scrapping/web-scrapping-cheerio';


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

            const sessionDoc = new this.sessionModel({...data,userId});
            const sessionData: SessionDocument = (await sessionDoc.save()).toObject();

            // first upload the files on cloudinary
            const cloudinaryFileLinks = await Promise.all(operations);
            if(cloudinaryFileLinks.length){
                data.context[Contexts.PDF_FILES] = cloudinaryFileLinks.filter((f: {fileType: FileTypes, link: string})=>
                    f.fileType === FileTypes.PDF_FILES).map(v=>v.link);
            }

            operations = [];
            
            // if context has website links, then scrap the website content
            if(data.context[Contexts.WEBSITE_LINKS]?.length){
                const res: ScrapedContent[]= [];
                for(const link of data.context[Contexts.WEBSITE_LINKS]){
                    const content = await scrapeWebsite(link, {maxDepth:1});
                    res.push(...content);
                }
                operations.push(this.langchainService.uploadTextInQdrant(res, userId, sessionData._id as string));
            }
            for(let idx = 0; idx < cloudinaryFileLinks.length; idx++){
                operations.push(this.langchainService.uploadFileInQdrantStore(`uploads/${files[idx].filename}`, userId, sessionData._id as string))
            }
            
            await Promise.all(operations);
            const res = await this.sessionModel.findByIdAndUpdate(
                        sessionData._id,
                        { $set: { isReadyToUse: true } },
                        { new: true }
                    )
                    
            return res?.toObject();
            
        } catch (error) {
            throw new InternalServerErrorException({message: 'something went wrong', error})
        }

    }
}
