import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import * as fs from 'fs';
import { FileTypes } from 'src/session/dto/create-session.dto';


export enum FileExtensions{
    PDF_FILE= ".pdf",
    DOC_FILE = ".docx",
    CSV_FILE = ".csv"
}
@Injectable()
export class CloudinaryService {
 async uploadFile(file: Express.Multer.File): Promise<{link: string, fileType: FileTypes}> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            let fileType!: FileTypes;
            if(file.originalname.endsWith(FileExtensions.PDF_FILE)){
              fileType = FileTypes.PDF_FILES
            }
            resolve({link:result.secure_url, fileType});
          }
        },
      );
      fs.createReadStream(file.path).pipe(uploadStream);
    });
  }
}

