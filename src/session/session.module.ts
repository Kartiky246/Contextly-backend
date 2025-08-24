import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './session.schema';
import { SessionController } from './session.controller';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { LangchainModule } from 'src/common/langchain/langchain.module';


@Module({
  imports: [MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]), CloudinaryModule, LangchainModule],
  providers: [SessionService],
  controllers: [SessionController]
})
export class SessionModule {}
