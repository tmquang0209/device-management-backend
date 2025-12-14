import {
  AuditLogsEntity,
  ConfigEntity,
  DeviceEntity,
  DeviceLocationEntity,
  DeviceTypeEntity,
  EquipmentLoanSlipDetailEntity,
  EquipmentLoanSlipEntity,
  EquipmentReturnSlipDetailEntity,
  EquipmentReturnSlipEntity,
  MaintenanceReturnSlipDetailEntity,
  MaintenanceReturnSlipEntity,
  MaintenanceSlipDetailEntity,
  MaintenanceSlipEntity,
  ParamEntity,
  PermissionEntity,
  RackEntity,
  RoleEntity,
  RolePermissionsEntity,
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
      EquipmentReturnSlipEntity,
      EquipmentReturnSlipDetailEntity,
      ParamEntity,
      PartnerEntity,
      // SupplierEntity,
      WarrantyEntity,
      RackEntity,
      MaintenanceSlipEntity,
      MaintenanceSlipDetailEntity,
      MaintenanceReturnSlipEntity,
      MaintenanceReturnSlipDetailEntity,
    ]),
    SequelizeModule.forRootAsync({
      useFactory: databaseConfig,
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
