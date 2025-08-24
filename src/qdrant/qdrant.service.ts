// import { Injectable } from '@nestjs/common';
// // import { QdrantClient } from 'qdrant-node';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class QdrantService {
//   private client: QdrantClient;

//   constructor(private readonly configService: ConfigService) {
//     this.client = new QdrantClient({ url: this.configService.get<string>('QDRANT_DB_URI') });
//   }

//   getClient(): QdrantClient {
//     return this.client;
//   }

//   async createCollection(collectionName: string, vectorSize: number) {
//     return this.client.collections.create({
//       collection_name: collectionName,
//       vectors: { size: vectorSize, distance: 'Cosine' },
//     });
//   }

// }
