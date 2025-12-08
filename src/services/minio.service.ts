import {
  FileFilter,
  FileManagementConfig,
  FileMetadata,
  UploadResult,
} from '@dto';
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { AbstractFileManager } from '@services';
import * as fs from 'fs';
import * as Minio from 'minio';
import { I18nService } from 'nestjs-i18n';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioFileManager
  extends AbstractFileManager
  implements OnModuleInit
{
  private readonly minioClient: Minio.Client;

  constructor(
    config: FileManagementConfig,
    protected i18n: I18nService,
  ) {
    super(config, i18n);

    if (
      !config.storage.endpoint ||
      !config.storage.accessKey ||
      !config.storage.secretKey
    ) {
      throw new Error('MinIO configuration is incomplete');
    }

    this.minioClient = new Minio.Client({
      endPoint: config.storage.endpoint,
      port: config.storage.port || 9000,
      useSSL: config.storage.useSSL || false,
      accessKey: config.storage.accessKey,
      secretKey: config.storage.secretKey,
      pathStyle: true,
    });
  }

  async onModuleInit() {
    if (!this.config.storage.bucketName) {
      throw new Error('Bucket name is required for MinIO');
    }

    const exists = await this.minioClient.bucketExists(
      this.config.storage.bucketName,
    );
    if (!exists) {
      await this.minioClient.makeBucket(this.config.storage.bucketName);
      Logger.log(`Bucket '${this.config.storage.bucketName}' created.`);
    } else {
      Logger.log(`Bucket '${this.config.storage.bucketName}' already exists.`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    metadata?: Partial<FileMetadata>,
  ): Promise<UploadResult> {
    try {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      const fileName = this.generateFileName(file.originalname);
      const filePath = this.buildFilePath(folder, fileName);

      // Read file content
      const fileBuffer = fs.readFileSync(file.path);

      // Upload to MinIO
      await this.minioClient.putObject(
        this.config.storage.bucketName!,
        filePath,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': file.mimetype,
          'Original-Name': file.originalname,
          ...(metadata?.tags && { Tags: JSON.stringify(metadata.tags) }),
        },
      );

      // Clean up temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const fileMetadata: FileMetadata = {
        id: uuidv4(),
        originalName: file.originalname,
        fileName,
        filePath,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        folder,
        isPublic: metadata?.isPublic || false,
        ...metadata,
      };

      return { success: true, file: fileMetadata };
    } catch (error) {
      console.error('Error uploading file to MinIO:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.upload_failed'),
      );
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string,
    metadata?: Partial<FileMetadata>,
  ): Promise<UploadResult> {
    try {
      const generatedFileName = this.generateFileName(fileName);
      const filePath = this.buildFilePath(folder, generatedFileName);

      await this.minioClient.putObject(
        this.config.storage.bucketName!,
        filePath,
        buffer,
        buffer.length,
        { 'Content-Type': mimeType },
      );

      const fileMetadata: FileMetadata = {
        id: uuidv4(),
        originalName: fileName,
        fileName: generatedFileName,
        filePath,
        mimeType,
        size: buffer.length,
        uploadedAt: new Date(),
        folder,
        isPublic: metadata?.isPublic || false,
        ...metadata,
      };

      return { success: true, file: fileMetadata };
    } catch (error) {
      console.error('Error uploading buffer to MinIO:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.upload_failed'),
      );
    }
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    try {
      const stream = await this.minioClient.getObject(
        this.config.storage.bucketName!,
        filePath,
      );

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) =>
          chunks.push(chunk as Buffer<ArrayBufferLike>),
        );
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch {
      throw new BadRequestException(
        this.i18n.t('upload.file_not_found', { args: { fileName: filePath } }),
      );
    }
  }

  async getPresignedUploadUrl(
    fileName: string,
    folder: string,
    expirySeconds?: number,
  ): Promise<string> {
    const filePath = this.buildFilePath(folder, fileName);
    const expiry = expirySeconds || this.config.security.presignedUrlExpiry;

    return this.minioClient.presignedPutObject(
      this.config.storage.bucketName!,
      filePath,
      expiry,
    );
  }

  async getPresignedDownloadUrl(
    filePath: string,
    expirySeconds?: number,
  ): Promise<string> {
    const expiry = expirySeconds || this.config.security.presignedUrlExpiry;

    return this.minioClient.presignedGetObject(
      this.config.storage.bucketName!,
      filePath,
      expiry,
    );
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await this.minioClient.removeObject(
        this.config.storage.bucketName!,
        filePath,
      );
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async listFiles(filter?: FileFilter): Promise<FileMetadata[]> {
    // This is a simplified implementation
    // In a real scenario, you'd want to store metadata in a database
    const files: FileMetadata[] = [];
    const stream = this.minioClient.listObjects(
      this.config.storage.bucketName!,
      filter?.folder,
      true,
    );

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        files.push({
          id: obj.etag || '',
          originalName: obj.name || '',
          fileName: path.basename(obj.name || ''),
          filePath: obj.name || '',
          mimeType: '',
          size: obj.size || 0,
          uploadedAt: obj.lastModified || new Date(),
          folder: path.dirname(obj.name || ''),
          isPublic: false,
        });
      });
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(
        this.config.storage.bucketName!,
        filePath,
      );
      return true;
    } catch {
      return false;
    }
  }
}
