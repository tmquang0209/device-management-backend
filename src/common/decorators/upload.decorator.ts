import { UseInterceptors, applyDecorators } from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import slugify from 'slugify';

/**
 * Custom decorator for handling file uploads.
 * It uses FileInterceptor to process a single file and stores it in a temporary directory
 * with a unique, slugified filename.
 *
 * @param fieldName The name of the field in the request body that contains the file (e.g., 'file').
 * @returns A method decorator that applies the necessary interceptors for file upload.
 */
export function FileUpload(fieldName: string) {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, {
        storage: diskStorage({
          destination: './tmp', // Temporary storage directory
          filename: (req, file, cb) => {
            const ext = path.extname(file.originalname); // Get file extension
            const baseName = path.basename(file.originalname, ext); // Get filename without extension

            // Create a safe filename by slugifying the original name
            const safeName = slugify(baseName, { lower: true, strict: true });

            const timestamp = Date.now(); // Add timestamp to ensure filename uniqueness
            cb(null, `${safeName}-${timestamp}${ext}`); // Return the generated filename
          },
        }),
      }),
    ),
  );
}

/**
 * Custom decorator for handling multiple file uploads with custom filename and diskStorage.
 * Applies FileFieldsInterceptor for fields like 'thumbnail' and 'attachments'.
 *
 * @returns A method decorator.
 */
export function FilesUpload(
  uploadFields: { name: string; maxCount: number }[],
  fileSizeLimit = 5 * 1024 * 1024, // Default to 5MB per file
  fileFilter?: (req: any, file: any, cb: any) => void,
) {
  return applyDecorators(
    UseInterceptors(
      FileFieldsInterceptor(uploadFields, {
        storage: diskStorage({
          destination: './tmp',
          filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext);

            // Slugify with Vietnamese locale support
            const safeName = slugify(baseName, {
              lower: true,
              strict: true,
              locale: 'vi',
            });

            const timestamp = Date.now();
            cb(null, `${safeName}-${timestamp}${ext}`);
          },
        }),
        limits: {
          fileSize: fileSizeLimit,
        },
        fileFilter,
      }),
    ),
  );
}
