import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema';

@Injectable()
export class SessionService {
    constructor(@InjectModel(Session.name) private sessionModel: Model<SessionDocument>){}

    getAllSessions = async (userId: string) =>{
        return this.sessionModel
        .find({userId})
        .sort({createdAt: -1})
        .exec()
    }
}
