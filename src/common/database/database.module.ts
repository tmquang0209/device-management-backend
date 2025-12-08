import {
  AuditLogsEntity,
  ConfigEntity,
  DeviceEntity,
  DeviceLocationEntity,
  DeviceTypeEntity,
  EquipmentLoanSlipDetailEntity,
  EquipmentLoanSlipEntity,
  ParamEntity,
  PermissionEntity,
  RoleEntity,
  RolePermissionsEntity,
  SupplierEntity,
  UserEntity,
  WarrantyEntity,
} from '@entities';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PartnerEntity } from 'src/entities/partner.entity';
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
      PartnerEntity,
      DeviceEntity,
      DeviceTypeEntity,
      DeviceLocationEntity,
      EquipmentLoanSlipEntity,
      EquipmentLoanSlipDetailEntity,
      ParamEntity,
      PartnerEntity,
      SupplierEntity,
      WarrantyEntity,
    ]),
    SequelizeModule.forRootAsync({
      useFactory: databaseConfig,
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
