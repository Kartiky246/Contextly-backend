import { Injectable } from '@nestjs/common';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
// import { TextLoader } from "@langchain/community/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ConfigService } from '@nestjs/config';
import fs from "fs";


export enum FilType{
    PDF_FILE= "PDF",
    DOC_FILE = "DOCUMENT",
    CSV_FILE = "CSV"
}

@Injectable()
export class LangchainService {
    constructor(private readonly configService: ConfigService){}

    uploadFileInQdrantStore = async (
    filePath: string,
    userId: string,
    sessionId: string,
    fileLink: string) => {
    let loader;
    let docType: FilType;
    if (filePath.endsWith(".pdf")) {
        loader = new PDFLoader(filePath);
        docType = FilType.PDF_FILE;
    } else if (filePath.endsWith(".docx")) {
        loader = new DocxLoader(filePath);
        docType = FilType.DOC_FILE;
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
            docType,
            fileLink,
        },
    }));

    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
        apiKey: this.configService.get<string>('OPEN_AI_API_KEY')
    });

    const res = await QdrantVectorStore.fromDocuments(docsWithMetadata, embeddings, {
        url: this.configService.get<string>("QDRANT_DB_URL"),
        collectionName: "session",
        apiKey: this.configService.get<string>("QDRANT_DB_API_KEY"),
    });

    fs.unlinkSync(filePath);
};

}

