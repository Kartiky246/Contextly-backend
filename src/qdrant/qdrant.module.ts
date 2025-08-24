import { Module } from '@nestjs/common';
import { QdrantInitService } from './qdrant.service';

@Module({
  providers: [QdrantInitService],
  exports: [QdrantInitService]
})
export class QdrantModule {}
