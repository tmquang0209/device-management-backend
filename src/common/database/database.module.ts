import {
  AuditLogsEntity,
  ConfigEntity,
  PaymentProviderEntity,
  PaymentTransactionEntity,
  PermissionEntity,
  RoleEntity,
  RolePermissionsEntity,
  UserEntity,
} from '@entities';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './database.config';

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserEntity,
      RoleEntity,
      RolePermissionsEntity,
      PermissionEntity,
      AuditLogsEntity,
      ConfigEntity,
      PaymentProviderEntity,
      PaymentTransactionEntity,
    ]),
    SequelizeModule.forRootAsync({
      useFactory: databaseConfig,
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
