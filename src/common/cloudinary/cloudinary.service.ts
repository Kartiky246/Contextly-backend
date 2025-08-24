import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import * as fs from 'fs';

@Injectable()
export class CloudinaryService {
 async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            // fs.unlink(file.path, (unlinkErr) => {
            //   if (unlinkErr) {
            //     console.error('Failed to delete local file:', unlinkErr);
            //   }
            // });

            resolve(result.secure_url);
          }
        },
      );
      fs.createReadStream(file.path).pipe(uploadStream);
    });
  }
}

