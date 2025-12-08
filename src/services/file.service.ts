import {
  FileFilter,
  FileManagementConfig,
  FileMetadata,
  UploadResult,
} from '@dto';
import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as path from 'path';

export abstract class AbstractFileManager {
  protected config: FileManagementConfig;

  constructor(
    config: FileManagementConfig,
    protected readonly i18n: I18nService,
  ) {
    this.config = config;
  }

  // Optional lifecycle hook
  onModuleInit?(): Promise<void>;

  abstract uploadFile(
    file: Express.Multer.File,
    folder: string,
    metadata?: Partial<FileMetadata>,
  ): Promise<UploadResult>;

  abstract uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string,
    metadata?: Partial<FileMetadata>,
  ): Promise<UploadResult>;

  abstract downloadFile(filePath: string): Promise<Buffer>;

  abstract getPresignedUploadUrl(
    fileName: string,
    folder: string,
    expirySeconds?: number,
  ): Promise<string>;

  abstract getPresignedDownloadUrl(
    filePath: string,
    expirySeconds?: number,
  ): Promise<string>;

  abstract deleteFile(filePath: string): Promise<boolean>;

  abstract listFiles(filter?: FileFilter): Promise<FileMetadata[]>;

  abstract fileExists(filePath: string): Promise<boolean>;

  // Common validation methods
  protected validateFile(file: Express.Multer.File): {
    valid: boolean;
    error?: string;
  } {
    if (file.size > this.config.upload.maxFileSize) {
      throw new BadRequestException(this.i18n.t('upload.file_too_large'));
    }

    if (
      this.config.upload.allowedMimeTypes.length > 0 &&
      !this.config.upload.allowedMimeTypes.includes(file.mimetype)
    ) {
      throw new BadRequestException(this.i18n.t('upload.invalid_file_type'));
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (
      this.config.upload.allowedExtensions.length > 0 &&
      !this.config.upload.allowedExtensions.includes(ext)
    ) {
      throw new BadRequestException(
        this.i18n.t('upload.invalid_file_extension'),
      );
    }

    return { valid: true };
  }

  protected generateFileName(originalName: string): string {
    if (!this.config.upload.generateUniqueName) {
      return originalName;
    }

    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    return `${name}-${timestamp}-${random}${ext}`;
  }

  protected buildFilePath(folder: string, fileName: string): string {
    return `${folder}/${fileName}`.replace(/\/+/g, '/');
  }
}
