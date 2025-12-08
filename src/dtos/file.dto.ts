export interface FileManagementConfig {
  storage: {
    type: 'local' | 'minio' | 's3' | 'gcs';
    endpoint?: string;
    port?: number;
    useSSL?: boolean;
    accessKey?: string;
    secretKey?: string;
    bucketName?: string;
    region?: string;
    basePath?: string; // For local storage
  };
  upload: {
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    tempDir: string;
    generateUniqueName: boolean;
  };
  security: {
    presignedUrlExpiry: number; // in seconds
    enableVirusScan: boolean;
    maxFilesPerRequest: number;
  };
}

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: string;
  folder: string;
  tags?: string[] | Record<string, string>;
  isPublic: boolean;
  expiresAt?: Date;
}

export interface UploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
  presignedUrl?: string;
}

export interface FileFilter {
  folder?: string;
  mimeType?: string;
  uploadedBy?: string;
  tags?: string[];
  dateRange?: { from: Date; to: Date };
  isPublic?: boolean;
}
