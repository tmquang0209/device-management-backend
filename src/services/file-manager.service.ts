import {
  FileFilter,
  FileManagementConfig,
  FileMetadata,
  UploadResult,
} from '@dto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  AbstractFileManager,
  MinioFileManager,
  S3FileManager,
} from '@services';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class FileManagementService implements OnModuleInit {
  private fileManager: AbstractFileManager;

  constructor(
    private readonly config: FileManagementConfig,
    private readonly i18n: I18nService,
  ) {
    this.initializeFileManager();
  }

  async onModuleInit() {
    // Delegate onModuleInit to the underlying file manager if it implements it
    if (
      'onModuleInit' in this.fileManager &&
      typeof this.fileManager.onModuleInit === 'function'
    ) {
      await this.fileManager.onModuleInit();
    }
  }

  private initializeFileManager() {
    switch (this.config.storage.type) {
      case 'minio':
        this.fileManager = new MinioFileManager(this.config, this.i18n);
        break;
      case 's3':
        this.fileManager = new S3FileManager(this.config, this.i18n);
        break;
      default:
        throw new Error(
          `Unsupported storage type: ${this.config.storage.type}`,
        );
    }
  }

  // Delegate all methods to the file manager
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    metadata?: Partial<FileMetadata>,
  ): Promise<UploadResult> {
    return this.fileManager.uploadFile(file, folder, metadata);
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string,
    metadata?: Partial<FileMetadata>,
  ): Promise<UploadResult> {
    return this.fileManager.uploadBuffer(
      buffer,
      fileName,
      mimeType,
      folder,
      metadata,
    );
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    return this.fileManager.downloadFile(filePath);
  }

  async getPresignedUploadUrl(
    fileName: string,
    folder: string,
    expirySeconds?: number,
  ): Promise<string> {
    return this.fileManager.getPresignedUploadUrl(
      fileName,
      folder,
      expirySeconds,
    );
  }

  async getPresignedDownloadUrl(
    filePath: string,
    expirySeconds?: number,
  ): Promise<string> {
    return this.fileManager.getPresignedDownloadUrl(filePath, expirySeconds);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    return this.fileManager.deleteFile(filePath);
  }

  async listFiles(filter?: FileFilter): Promise<FileMetadata[]> {
    return this.fileManager.listFiles(filter);
  }

  async fileExists(filePath: string): Promise<boolean> {
    return this.fileManager.fileExists(filePath);
  }

  // Batch operations
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string,
    metadata?: Partial<FileMetadata>,
  ): Promise<UploadResult[]> {
    const results = await Promise.allSettled(
      files.map((file) => this.uploadFile(file, folder, metadata)),
    );

    return results.map((result) =>
      result.status === 'fulfilled'
        ? result.value
        : { success: false, error: 'Upload failed' },
    );
  }

  async deleteMultipleFiles(filePaths: string[]): Promise<boolean[]> {
    const results = await Promise.allSettled(
      filePaths.map((path) => this.deleteFile(path)),
    );

    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : false,
    );
  }
}
