import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QdrantInitService implements OnModuleInit {
    client!: QdrantClient;

    constructor(private readonly configService: ConfigService) {
        this.client = new QdrantClient({
            url: this.configService.get<string>('QDRANT_DB_URL'),
            apiKey: this.configService.get<string>('QDRANT_DB_API_KEY'),
        });
    }

    async onModuleInit() {
        try {
            await this.client.createCollection('session', {
                vectors: { size: 1536, distance: "Cosine" }
            });
        } catch (err: any) {
            if (err?.status === 409) {
                console.log('ℹ️ Collection already exists, skipping create.');
            } else {
                throw err;
            }
        }

        try {
            await this.client.createPayloadIndex('session', {
                field_name: 'metadata.sessionId',
                field_schema: 'keyword',
            });

            await this.client.createPayloadIndex('session', {
                field_name: 'metadata.userId',
                field_schema: 'keyword',
            });

            console.log('✅ Indexes for sessionId & userId created.');
        } catch (err: any) {
            if (err?.status === 409) {
                console.log('ℹ️ Indexes already exist, skipping.');
            } else {
                throw err;
            }
        }

        console.log('✅ Qdrant setup done');
    }

    get qdrantClinet(){
        return this.client;
    }
}
