import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const pdfLoader = async (filepath='') =>{
    const loader = new PDFLoader(filepath, {splitPages: true});
    return new Promise(async (req, res)=>{
        const doc = await loader;
        res(doc);
    })
}