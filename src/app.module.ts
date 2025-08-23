import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoreModule } from './store/store.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [StoreModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
