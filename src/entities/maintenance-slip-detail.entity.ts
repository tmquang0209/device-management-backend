import { BaseEntity } from '@common/database';
import { EMaintenanceSlipDetailStatus } from '@common/enums';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { DeviceEntity } from './device.entity';
import { MaintenanceSlipEntity } from './maintenance-slip.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'maintenance_slip_detail',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class MaintenanceSlipDetailEntity extends BaseEntity<MaintenanceSlipDetailEntity> {
  @ForeignKey(() => MaintenanceSlipEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'maintenance_slip_id',
  })
  declare maintenanceSlipId: string;

  @BelongsTo(() => MaintenanceSlipEntity)
  declare maintenanceSlip?: MaintenanceSlipEntity;

  @ForeignKey(() => DeviceEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'device_id',
  })
  declare deviceId: string;

  @BelongsTo(() => DeviceEntity)
  declare device?: DeviceEntity;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'status',
    defaultValue: EMaintenanceSlipDetailStatus.SENT,
  })
  declare status: EMaintenanceSlipDetailStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'return_date',
  })
  declare returnDate: Date | null;

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
}
