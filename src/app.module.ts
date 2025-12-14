import { CommonModule } from '@common/common.module';
import { DatabaseModule } from '@common/database/database.module';
import { JwtStrategy, RefreshTokenStrategy } from '@common/guards';
import {
  AuditLogInterceptor,
  CustomCacheInterceptor,
} from '@common/interceptor';
import { LoggerMiddleware } from '@common/middlewares';
import { MailConsumer } from '@consumers';
import {
  AppController,
  AuditController,
  AuthController,
  ConfigController,
  DashboardController,
  DeviceController,
  DeviceLocationController,
  DeviceTypeController,
  LoanSlipController,
  MaintenanceReturnSlipController,
  MaintenanceSlipController,
  ParamController,
  PartnerController,
  RackController,
  ReturnSlipController,
  RoleController,
  UploadController,
  UserController,
  WarrantyController,
} from '@controllers';
import { FileManagementConfig } from '@dto/file.dto';
import { EventGateway } from '@gateways';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { MailProducer } from '@producers';
import {
  ConfigService as AppConfigService,
  AuditContextService,
  AuditLogService,
  AuthService,
  CacheService,
  DashboardService,
  DeviceLocationService,
  DeviceService,
  DeviceTypeService,
  FileManagementService,
  LoanSlipService,
  MailService,
  ParamService,
  PartnerService,
  RackService,
  ReturnSlipService,
  RoleService,
  RoutesExplorer,
  SeedService,
  TokenService,
  UserService,
  VersionService,
  WarrantyService,
} from '@services';
import { ClsService } from 'nestjs-cls';
import { I18nService } from 'nestjs-i18n';
import { SeederModule } from './seeders/seeder.module';
import { MaintenanceReturnSlipService } from './services/maintenance-return-slip.service';
import { MaintenanceSlipService } from './services/maintenance-slip.service';

@Module({
  imports: [CommonModule, DatabaseModule, SeederModule],
  controllers: [
    AppController,
    UserController,
    AuthController,
    UploadController,
    RoleController,
    AuditController,
    ConfigController,
    DashboardController,
    DeviceLocationController,
    DeviceTypeController,
    DeviceController,
    LoanSlipController,
    MaintenanceReturnSlipController,
    MaintenanceSlipController,
    ParamController,
    PartnerController,
    // SupplierController,
    WarrantyController,
    RackController,
    ReturnSlipController,
  ], // need to add controllers here
  providers: [
    AuthService,
    UserService,
    MailService,
    RoleService,
    CacheService,
    TokenService,
    AuditLogService,
    AuditContextService,
    VersionService,
    RoutesExplorer,
    AppConfigService,
    SeedService,
    JwtStrategy,
    RefreshTokenStrategy,
    EventGateway,
    MailConsumer,
    MailProducer,
    DashboardService,
    DeviceService,
    DeviceTypeService,
    DeviceLocationService,
    LoanSlipService,
    MaintenanceReturnSlipService,
    MaintenanceSlipService,
    WarrantyService,
    ParamService,
    PartnerService,
    RackService,
    ReturnSlipService,
    // SupplierService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomCacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (
        reflector: Reflector,
        auditSvc: AuditLogService,
        cls: ClsService,
      ) => new AuditLogInterceptor(auditSvc, reflector, cls),
      inject: [Reflector, AuditLogService, ClsService],
    },
    {
      provide: 'FILE_MANAGEMENT_CONFIG',
      useFactory: (configService: ConfigService): FileManagementConfig => {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
          storage: {
            type: 's3',
            region: process.env.MINIO_REGION || 'us-east-1',
            endpoint: process.env.MINIO_ENDPOINT,
            port: Number(process.env.MINIO_PORT),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
            bucketName:
              process.env.MINIO_BUCKET ||
              (isProduction ? 'prod-uploads' : 'dev-uploads'),
          },
          upload: {
            maxFileSize:
              Number(process.env.MAX_FILE_SIZE) ||
              (isProduction ? 50 * 1024 * 1024 : 10 * 1024 * 1024),
            allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
              'application/pdf',
              'text/plain',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            allowedExtensions: configService
              .get('ALLOWED_EXTENSIONS')
              ?.split(',') || [
              '.jpg',
              '.jpeg',
              '.png',
              '.gif',
              '.webp',
              '.pdf',
              '.txt',
              '.doc',
              '.docx',
            ],
            tempDir: configService.get('TEMP_DIR') || './tmp',
            generateUniqueName:
              configService.get('GENERATE_UNIQUE_NAME') !== 'false',
          },
          security: {
            presignedUrlExpiry:
              Number(configService.get('PRESIGNED_URL_EXPIRY')) ||
              (isProduction ? 900 : 3600),
            enableVirusScan: configService.get('ENABLE_VIRUS_SCAN') === 'true',
            maxFilesPerRequest:
              Number(configService.get('MAX_FILES_PER_REQUEST')) ||
              (isProduction ? 5 : 10),
          },
        };
      },
      inject: [ConfigService],
    },
    {
      provide: FileManagementService,
      useFactory: (config: FileManagementConfig, i18n: I18nService) => {
        return new FileManagementService(config, i18n);
      },
      inject: ['FILE_MANAGEMENT_CONFIG', I18nService],
    },
    {
      provide: 'FileManagementService', // Use string token to avoid conflicts
      useFactory: (fileManagementService: FileManagementService) => {
        return fileManagementService; // Delegate to existing service
      },
      inject: [FileManagementService],
    },
  ], // need to add providers here
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
