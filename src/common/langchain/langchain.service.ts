import { Injectable } from '@nestjs/common';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
// import { TextLoader } from "@langchain/community/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ConfigService } from '@nestjs/config';
import fs from "fs";
import { FileExtensions } from '../cloudinary/cloudinary.service';
import { FileTypes } from 'src/session/dto/create-session.dto';


@Injectable()
export class LangchainService {
    constructor(private readonly configService: ConfigService){}

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

    // const embeddings = new OpenAIEmbeddings({
    //     model: "text-embedding-3-small",
    //     apiKey: this.configService.get<string>('OPEN_AI_API_KEY')
    // });

    // const res = await QdrantVectorStore.fromDocuments(docsWithMetadata, embeddings, {
    //     url: this.configService.get<string>("QDRANT_DB_URL"),
    //     collectionName: "session",
    //     apiKey: this.configService.get<string>("QDRANT_DB_API_KEY"),
    // });

    fs.unlinkSync(filePath);
};

}

