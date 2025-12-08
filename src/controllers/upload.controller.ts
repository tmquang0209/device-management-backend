import {
  AllowUnauthorized,
  EndpointKey,
  FilesUpload,
  FileUpload,
  ResponseMessage,
} from '@common/decorators';
import { FileMetadata } from '@dto/file.dto';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileManagementService } from '@services';
import { Response } from 'express';
import { I18nService, i18nValidationMessage } from 'nestjs-i18n';
import * as path from 'path';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Controller('upload')
@AllowUnauthorized()
export class UploadController {
  constructor(
    private readonly fileService: FileManagementService,
    private readonly i18n: I18nService,
  ) {}

  @EndpointKey('upload.single_file')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.upload_success'),
  )
  @Post()
  @FileUpload('file')
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'images',
    @Query('public') isPublic: string = 'false',
    @Query('tags') tags?: string,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException(this.i18n.t('upload.no_file_provided'));
    }

    try {
      const metadata: Partial<FileMetadata> = {
        isPublic: isPublic === 'true',
        tags: tags ? tags.split(',').map((tag) => tag.trim()) : undefined,
        uploadedBy: 'anonymous', // Replace with actual user ID from auth context
      };

      const result = await this.fileService.uploadFile(file, folder, metadata);

      if (!result.success) {
        throw new BadRequestException(result.error);
      }

      return {
        id: result.file?.id,
        fileName: result.file?.fileName,
        originalName: result.file?.originalName,
        filePath: result.file?.filePath,
        size: result.file?.size,
        mimeType: result.file?.mimeType,
        uploadedAt: result.file?.uploadedAt,
        folder: result.file?.folder,
        isPublic: result.file?.isPublic,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.upload_failed'),
      );
    }
  }

  @EndpointKey('upload.multiple_files')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.upload_success'),
  )
  @Post('multiple')
  @FilesUpload([{ name: 'files', maxCount: 10 }])
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: string = 'images',
    @Query('public') isPublic: string = 'false',
    @Query('tags') tags?: string,
  ): Promise<any> {
    if (!files || files.length === 0) {
      throw new BadRequestException(this.i18n.t('upload.no_file_provided'));
    }

    try {
      const metadata: Partial<FileMetadata> = {
        isPublic: isPublic === 'true',
        tags: tags ? tags.split(',').map((tag) => tag.trim()) : undefined,
        uploadedBy: 'anonymous', // Replace with actual user ID from auth context
      };

      const results = await this.fileService.uploadMultipleFiles(
        files,
        folder,
        metadata,
      );

      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      return {
        successful: successful.map((r) => ({
          id: r.file?.id,
          fileName: r.file?.fileName,
          originalName: r.file?.originalName,
          filePath: r.file?.filePath,
          size: r.file?.size,
          mimeType: r.file?.mimeType,
          uploadedAt: r.file?.uploadedAt,
          folder: r.file?.folder,
          isPublic: r.file?.isPublic,
        })),
        failed: failed.map((r) => ({
          fileName: files[results.indexOf(r)]?.originalname || 'unknown',
          error: r.error,
        })),
      };
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.upload_failed'),
      );
    }
  }

  @EndpointKey('upload.download_file')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.download_success'),
  )
  @Get('download/:folder/:fileName')
  async downloadFile(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = `${folder}/${fileName}`;

    try {
      const buffer = await this.fileService.downloadFile(filePath);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.send(buffer);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new BadRequestException(
        error.message ||
          this.i18n.t('upload.file_not_found', { args: { fileName } }),
      );
    }
  }

  @EndpointKey('upload.get_presigned_upload_url')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>(
      'upload.get_presigned_upload_url_success',
    ),
  )
  @Get('presigned-upload-url')
  async getPresignedUploadUrl(
    @Query('fileName') fileName: string,
    @Query('folder') folder: string = 'images',
    @Query('expiry') expiry?: string,
  ): Promise<any> {
    if (!fileName) {
      throw new BadRequestException(this.i18n.t('upload.file_name_required'));
    }

    try {
      const expirySeconds = expiry ? parseInt(expiry) : undefined;
      const url = await this.fileService.getPresignedUploadUrl(
        fileName,
        folder,
        expirySeconds,
      );

      return {
        success: true,
        uploadUrl: url,
        expiresIn: expirySeconds || 3600,
      };
    } catch (error) {
      console.error('Error generating presigned upload URL:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.upload_failed'),
      );
    }
  }

  @EndpointKey('upload.get_presigned_download_url')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>(
      'upload.get_presigned_download_url_success',
    ),
  )
  @Get('presigned-download-url')
  async getPresignedDownloadUrl(
    @Query('filePath') filePath: string,
    @Query('expiry') expiry?: string,
  ): Promise<any> {
    if (!filePath) {
      throw new BadRequestException(this.i18n.t('upload.file_path_required'));
    }

    try {
      const expirySeconds = expiry ? parseInt(expiry) : undefined;
      const url = await this.fileService.getPresignedDownloadUrl(
        filePath,
        expirySeconds,
      );

      return {
        success: true,
        downloadUrl: url,
        expiresIn: expirySeconds || 3600,
      };
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.download_failed'),
      );
    }
  }

  @EndpointKey('upload.list_files')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.list_files_success'),
  )
  @Get('list')
  async listFiles(
    @Query('folder') folder?: string,
    @Query('mimeType') mimeType?: string,
    @Query('public') isPublic?: string,
  ): Promise<any> {
    try {
      const filter = {
        folder,
        mimeType,
        isPublic: isPublic ? isPublic === 'true' : undefined,
      };

      const files = await this.fileService.listFiles(filter);

      return {
        success: true,
        files: files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          originalName: file.originalName,
          filePath: file.filePath,
          size: file.size,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
          folder: file.folder,
          isPublic: file.isPublic,
        })),
        count: files.length,
      };
    } catch (error) {
      console.error('Error listing files:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.list_files_failed'),
      );
    }
  }

  @EndpointKey('upload.delete_file')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.delete_file_success'),
  )
  @Delete(':folder/:fileName')
  async deleteFile(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
  ): Promise<any> {
    const filePath = `${folder}/${fileName}`;

    try {
      const deleted = await this.fileService.deleteFile(filePath);

      if (!deleted) {
        throw new NotFoundException(
          this.i18n.t('upload.file_not_found', { args: { fileName } }),
        );
      }

      return {
        success: true,
        message: this.i18n.t('upload.file_deleted_successfully'),
        filePath,
      };
    } catch (error) {
      console.error('Error deleting file:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || this.i18n.t('upload.delete_file_failed'),
      );
    }
  }

  @EndpointKey('upload.delete_multiple_files')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.delete_file_success'),
  )
  @Delete('batch')
  async deleteMultipleFiles(
    @Query('filePaths') filePaths: string,
  ): Promise<any> {
    if (!filePaths) {
      throw new BadRequestException(this.i18n.t('upload.file_paths_required'));
    }

    try {
      const pathArray = filePaths.split(',').map((path) => path.trim());
      const results = await this.fileService.deleteMultipleFiles(pathArray);

      const successful = results.filter((r) => r === true).length;
      const failed = results.length - successful;

      return {
        successful,
        failed,
        details: pathArray.map((path, index) => ({
          filePath: path,
          deleted: results[index],
        })),
      };
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.delete_file_failed'),
      );
    }
  }

  @EndpointKey('upload.check_file_exists')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.get_file_info_success'),
  )
  @Get('exists/:folder/:fileName')
  async checkFileExists(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
  ): Promise<any> {
    const filePath = `${folder}/${fileName}`;

    try {
      const exists = await this.fileService.fileExists(filePath);

      return {
        success: true,
        exists,
        filePath,
      };
    } catch (error) {
      console.error('Error checking file existence:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.check_file_exists_failed'),
      );
    }
  }

  // Additional utility endpoints
  @EndpointKey('upload.upload_from_url')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.upload_success'),
  )
  @Post('upload-from-url')
  async uploadFromUrl(
    @Query('url') url: string,
    @Query('folder') folder: string = 'images',
    @Query('fileName') fileName?: string,
  ): Promise<any> {
    if (!url) {
      throw new BadRequestException(this.i18n.t('upload.url_required'));
    }

    try {
      const fetch = require('node-fetch');
      const response = await fetch(url);

      if (!response.ok) {
        throw new BadRequestException(
          this.i18n.t('upload.fetch_from_url_failed'),
        );
      }

      const buffer = (await response.buffer()) as Buffer<ArrayBufferLike>;
      const contentType: string =
        response.headers.get('content-type') || 'application/octet-stream';

      // Extract filename from URL or use provided one
      const finalFileName =
        fileName ||
        path.basename(new URL(url).pathname) ||
        `file-${Date.now()}`;

      const result = await this.fileService.uploadBuffer(
        buffer,
        finalFileName,
        contentType,
        folder,
        {
          isPublic: false,
          uploadedBy: 'url-import',
        },
      );

      if (!result.success) {
        throw new BadRequestException(result.error);
      }

      return {
        success: true,
        message: this.i18n.t('upload.upload_from_url_success'),
        file: {
          id: result.file?.id,
          fileName: result.file?.fileName,
          originalName: result.file?.originalName,
          filePath: result.file?.filePath,
          size: result.file?.size,
          mimeType: result.file?.mimeType,
          uploadedAt: result.file?.uploadedAt,
        },
      };
    } catch (error) {
      console.error('Error uploading from URL:', error);
      throw new BadRequestException(
        error.message || this.i18n.t('upload.upload_from_url_failed'),
      );
    }
  }

  @EndpointKey('upload.get_file_info')
  @ResponseMessage(
    i18nValidationMessage<I18nTranslations>('upload.get_file_info_success'),
  )
  @Get('info/:folder/:fileName')
  async getFileInfo(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
  ): Promise<any> {
    const filePath = `${folder}/${fileName}`;

    try {
      // Check if file exists first
      const exists = await this.fileService.fileExists(filePath);

      if (!exists) {
        throw new NotFoundException(
          this.i18n.t('upload.file_not_found', { args: { fileName } }),
        );
      }

      // For now, we return basic info. In a real implementation,
      // you might want to store and retrieve more metadata from a database
      return {
        success: true,
        file: {
          fileName,
          folder,
          filePath,
          exists: true,
        },
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(this.i18n.t('upload.get_file_info_failed'));
    }
  }
}
