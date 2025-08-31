import { Injectable } from '@nestjs/common';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
// import { TextLoader } from "@langchain/community/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ConfigService } from '@nestjs/config';
import fs from "fs";
import { FileExtensions } from '../cloudinary/cloudinary.service';
import { FileTypes } from 'src/session/dto/create-session.dto';
import { OpenAiModel, OpenaiService } from '../openAi/openai/openai.service';
import path from 'path';
import { QdrantInitService } from 'src/qdrant/qdrant.service';


interface Where {
    must?: Array<{ key: string; match?: { value: string | number | boolean } }>;
    should?: any[];
    must_not?: any[];
}
@Injectable()
export class LangchainService {
    constructor(private readonly configService: ConfigService, private readonly openAiService: OpenaiService, private readonly qdrantService: QdrantInitService) { }

    uploadFileInQdrantStore = async (
        filePath: string,
        userId: string,
        sessionId: string) => {
        let loader;
        let docType: FileTypes;
        if (filePath.endsWith(FileExtensions.PDF_FILE)) {
            loader = new PDFLoader(filePath);
            docType = FileTypes.PDF_FILES;
        } else if (filePath.endsWith(FileExtensions.DOC_FILE)) {
            loader = new DocxLoader(filePath);
            docType = FileTypes.DOC_FILES;
        } else {
            throw new Error("Unsupported file type");
        }

        const docs = await loader.load();
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const splitDocs = await splitter.splitDocuments(docs);

        const docsWithMetadata = splitDocs.map((doc) => ({
            ...doc,
            metadata: {
                ...doc.metadata,
                userId,
                sessionId,
                docType
            },
        }));
        await this.qdrantService.onModuleInit();
        await QdrantVectorStore.fromDocuments(docsWithMetadata, this.openAiService.embedding, {
            url: this.configService.get<string>("QDRANT_DB_URL"),
            collectionName: "session",
            apiKey: this.configService.get<string>("QDRANT_DB_API_KEY"),
        });

        fs.unlinkSync(filePath);
    };

    getContext = async (
        message: string,
        sessionId: string,
        userId: string
    ) => {
        // check if the query is contextual or normal chit chat
        const classification = await this.openAiService.client.chat.completions.create({
            model: OpenAiModel.GPT_4O_MINI,
            messages: [
              { role: "system", content: "You are a classifier that labels user queries." },
              { role: "user", content: `Classify this: "${message}". 
               Reply only 'chitchat' or 'question'` }
            ]
          });
        if(classification.choices[0].message?.content === "chitchat"){
            return 
        }
        const store = await QdrantVectorStore.fromExistingCollection(
            this.openAiService.embedding,
            {
                url: this.configService.get<string>("QDRANT_DB_URL"),
                collectionName: "session",
                apiKey: this.configService.get<string>("QDRANT_DB_API_KEY"),
            }
        );

        const result = await store.similaritySearch(message, 3, {
            must: [
                {
                    key: "metadata.sessionId",
                    match: { value: sessionId },
                },
                {
                    key: "metadata.userId",
                    match: { value: userId }
                }

            ]
        });

        return result.reduce((acc, v) => {
            let str = `${v.pageContent}\n`;
            if (v?.metadata?.loc?.pageNumber && v?.metadata?.loc?.lines?.from && v?.metadata?.source) {
              const fileName = path.basename(v.metadata.source);
              str += "Content Source is:\n";
              str += `Document: ${fileName}, `;
              str += `Page Number: ${v.metadata.loc.pageNumber}, `;
              str += `Lines: ${v.metadata.loc.lines.from} to ${v.metadata.loc.lines.to}\n`;
            }
            return acc + str + "\n\n";
          }, "");
          
    };


}

