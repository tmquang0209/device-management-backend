import { BaseEntity } from '@common/database';
import { EDeviceStatus } from '@common/enums';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { DeviceLocationEntity } from './device-location.entity';
import { DeviceTypeEntity } from './device-type.entity';
import { EquipmentLoanSlipDetailEntity } from './equipment-loan-slip-detail.entity';
import { MaintenanceSlipEntity } from './maintenance-slip.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'device',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class DeviceEntity extends BaseEntity<DeviceEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'device_name',
  })
  declare deviceName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'serial',
  })
  declare serial?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'model',
  })
  declare model?: string;

  @ForeignKey(() => DeviceTypeEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'device_type_id',
  })
  declare deviceTypeId: string;

  @BelongsTo(() => DeviceTypeEntity)
  declare deviceType?: DeviceTypeEntity;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'supplier',
  })
  declare supplier?: string;

  @ForeignKey(() => DeviceLocationEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'device_location_id',
  })
  declare deviceLocationId: string | null;

  @BelongsTo(() => DeviceLocationEntity)
  declare deviceLocation?: DeviceLocationEntity;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'status',
  })
  declare status: EDeviceStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'purchase_date',
  })
  declare purchaseDate?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'warranty_expiration_date',
  })
  declare warrantyExpirationDate?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'note',
  })
  declare note?: string;

  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'created_by',
  })
  declare createdById?: string;

  @BelongsTo(() => UserEntity, 'createdById')
  declare createdByUser?: UserEntity;

  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'updated_by',
  })
  declare updatedById?: string;

  @BelongsTo(() => UserEntity, 'updatedById')
  declare updatedByUser?: UserEntity;

  @HasMany(() => MaintenanceSlipEntity)
  declare maintenanceSlips?: MaintenanceSlipEntity[];

  @HasMany(() => EquipmentLoanSlipDetailEntity)
  declare loanSlipDetails?: EquipmentLoanSlipDetailEntity[];
}
