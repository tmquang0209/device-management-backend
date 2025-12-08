import {
  CreateBucketCommand,
  CreateBucketCommandInput,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  FileFilter,
  FileManagementConfig,
  FileMetadata,
  UploadResult,
} from '@dto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AbstractFileManager } from '@services';
import * as fs from 'fs';
import { I18nService, logger } from 'nestjs-i18n';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3FileManager extends AbstractFileManager {
  private readonly s3: S3Client;

  private readonly normalizedBucketName: string;

  constructor(
    config: FileManagementConfig,
    protected i18n: I18nService,
  ) {
    super(config, i18n);

    const bucket = config.storage.bucketName!;

    if (!config.storage.accessKey || !config.storage.secretKey) {
      throw new Error('S3 configuration is incomplete: accessKey/secretKey');
    }
    if (!bucket) {
      throw new Error('S3 configuration is incomplete: bucketName');
    }

    // Normalize bucket name for S3/MinIO compatibility
    this.normalizedBucketName = bucket.toLowerCase();

    if (!S3FileManager.isValidBucketName(this.normalizedBucketName)) {
      throw new Error(
        `Invalid S3 bucket name: '${this.normalizedBucketName}'. Please use 3-63 chars [a-z0-9.-], no slashes/uppercase.`,
      );
    }

    const region = (config.storage as any).region || 'ap-southeast-1';
    const protocol = config.storage.useSSL ? 'https' : 'http';
    let endpoint: string | undefined;
    if (config.storage.endpoint) {
      const portPart = config.storage.port ? ':' + config.storage.port : '';
      endpoint = protocol + '://' + config.storage.endpoint + portPart;
    } else {
      endpoint = undefined;
    }

    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true, // Required for MinIO
      credentials: {
        accessKeyId: config.storage.accessKey,
        secretAccessKey: config.storage.secretKey,
      },
    });
  }

  async onModuleInit() {
    Logger.log(
      `S3FileManager initializing with bucket: ${this.normalizedBucketName}`,
    );

    try {
      await this.s3.send(
        new HeadBucketCommand({ Bucket: this.normalizedBucketName }),
      );
      Logger.log(
        `Bucket '${this.normalizedBucketName}' exists and is accessible.`,
      );
    } catch {
      Logger.warn(
        `Bucket '${this.normalizedBucketName}' not found, attempting to create...`,
      );
      try {
        const region = (this.s3.config.region as string) ?? 'ap-southeast-1';

        // For MinIO, don't use CreateBucketConfiguration
        const input: CreateBucketCommandInput = {
          Bucket: this.normalizedBucketName,
        };

        // Only add location constraint for AWS S3 (not MinIO)
        if (!this.s3.config.endpoint && region !== 'us-east-1') {
          input.CreateBucketConfiguration = {
            LocationConstraint: region as any,
          };
        }

        await this.s3.send(new CreateBucketCommand(input));
        Logger.log(
          `Bucket '${this.normalizedBucketName}' created successfully.`,
        );
      } catch (err) {
        Logger.error(
          `Cannot create bucket '${this.normalizedBucketName}':`,
          err,
        );
      }
    }
  }

  private normalizeKey(p: string): string {
    return p.replace(/\\/g, '/');
  }

  private static isValidBucketName(name: string): boolean {
    if (!name) return false;
    if (name.length < 3 || name.length > 63) return false;
    // More lenient validation for MinIO compatibility - allow dashes and underscores
    if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(name.toLowerCase()))
      return false;
    if (name.includes('..') || name.endsWith('.')) return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(name)) return false;
    return true;
  }

  private buildTaggingString(
    tags?: Record<string, string>,
  ): string | undefined {
    if (!tags) return undefined;
    // Tagging format: "k1=v1&k2=v2"
    const parts = Object.entries(tags).map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    );
    return parts.join('&');
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
      const rawKey = this.buildFilePath(folder, fileName);
      const key = this.normalizeKey(rawKey);

      // Đọc file tạm do Multer lưu
      const fileBuffer = fs.readFileSync(file.path);

      const tagging = this.buildTaggingString(
        metadata?.tags as Record<string, string>,
      );

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.normalizedBucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: file.mimetype,
          ACL: metadata?.isPublic ? 'public-read' : 'private',
          Metadata: {
            'original-name': file.originalname,
          },
          Tagging: tagging,
        }),
      );

      // Xoá file tạm
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const fileMetadata: FileMetadata = {
        id: uuidv4(),
        originalName: file.originalname,
        fileName,
        filePath: key,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        folder,
        isPublic: metadata?.isPublic || false,
        ...metadata,
      };

      return { success: true, file: fileMetadata };
    } catch (e) {
      logger.error('Error uploading file to S3:', e.stack);
      throw new BadRequestException(
        e.message || this.i18n.t('upload.upload_failed'),
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
      const rawKey = this.buildFilePath(folder, generatedFileName);
      const key = this.normalizeKey(rawKey);
      const tagging = this.buildTaggingString(
        metadata?.tags as Record<string, string>,
      );

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.normalizedBucketName,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ACL: metadata?.isPublic ? 'public-read' : 'private',
          Metadata: { 'original-name': fileName },
          Tagging: tagging,
        }),
      );

      const fileMetadata: FileMetadata = {
        id: uuidv4(),
        originalName: fileName,
        fileName: generatedFileName,
        filePath: key,
        mimeType,
        size: buffer.length,
        uploadedAt: new Date(),
        folder,
        isPublic: metadata?.isPublic || false,
        ...metadata,
      };

      return { success: true, file: fileMetadata };
    } catch (error) {
      console.error('Error uploading buffer to S3:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.upload_failed'),
      );
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on?.('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on?.('end', () => resolve(Buffer.concat(chunks)));
      stream.on?.('error', reject);
      if (typeof stream?.transformToByteArray === 'function') {
        stream
          .transformToByteArray()
          .then((arr: Uint8Array) => resolve(Buffer.from(arr)))
          .catch(reject);
      }
    });
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const key = this.normalizeKey(filePath);
    try {
      const res = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.normalizedBucketName,
          Key: key,
        }),
      );
      const body = res.Body as any;
      return await this.streamToBuffer(body);
    } catch (e) {
      logger.error('Error downloading file from S3:', e);
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
    const rawKey = this.buildFilePath(folder, fileName);
    const key = this.normalizeKey(rawKey);
    const expiresIn = Math.min(
      expirySeconds || this.config.security.presignedUrlExpiry || 3600,
      604800, // 7 days max
    );

    const command = new PutObjectCommand({
      Bucket: this.normalizedBucketName,
      Key: key,
    });
    return await getSignedUrl(this.s3, command, { expiresIn });
  }

  async getPresignedDownloadUrl(
    filePath: string,
    expirySeconds?: number,
  ): Promise<string> {
    const key = this.normalizeKey(filePath);
    const expiresIn = Math.min(
      expirySeconds || this.config.security.presignedUrlExpiry || 3600,
      604800,
    );
    const command = new GetObjectCommand({
      Bucket: this.normalizedBucketName,
      Key: key,
    });
    return await getSignedUrl(this.s3, command, { expiresIn });
  }

  async deleteFile(filePath: string): Promise<boolean> {
    const key = this.normalizeKey(filePath);
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.normalizedBucketName,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async listFiles(filter?: FileFilter): Promise<FileMetadata[]> {
    const prefix = filter?.folder
      ? this.normalizeKey(filter.folder).replace(/\/+$/, '') + '/'
      : undefined;

    const files: FileMetadata[] = [];
    let ContinuationToken: string | undefined = undefined;

    do {
      const res = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.normalizedBucketName,
          Prefix: prefix,
          ContinuationToken,
        }),
      );

      (res.Contents || []).forEach((obj) => {
        const name: string = obj.Key || '';
        files.push({
          id: (obj.ETag || '').replaceAll('"', ''),
          originalName: path.posix.basename(name),
          fileName: path.posix.basename(name),
          filePath: name,
          mimeType: '',
          size: obj.Size ?? 0,
          uploadedAt: obj.LastModified ?? new Date(),
          folder: path.posix.dirname(name),
          isPublic: false,
        });
      });

      ContinuationToken = res.IsTruncated
        ? res.NextContinuationToken
        : undefined;
    } while (ContinuationToken);

    return files;
  }

  async fileExists(filePath: string): Promise<boolean> {
    const key = this.normalizeKey(filePath);
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.normalizedBucketName,
          Key: key,
        }),
      );
      return true;
    } catch (e: any) {
      if (e?.$metadata?.httpStatusCode === 404) return false;
      Logger.warn(`HeadObject failed for ${key}: ${e?.name || e}`);
      return false;
    }
  }
}
