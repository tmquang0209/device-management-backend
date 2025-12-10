import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { DeviceEntity } from './device.entity';
import { PartnerEntity } from './partner.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'maintenance_slip',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class MaintenanceSlipEntity extends BaseEntity<MaintenanceSlipEntity> {
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
    type: DataType.STRING,
    allowNull: true,
    field: 'transfer_status',
  })
  declare transferStatus?: string;

  @ForeignKey(() => PartnerEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'partner_id',
  })
  declare partnerId?: string;

  @BelongsTo(() => PartnerEntity)
  declare partner?: PartnerEntity;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'reason',
  })
  declare reason?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'request_date',
  })
  declare requestDate?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'status',
  })
  declare status: number;

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
    field: 'modified_by',
  })
  declare modifiedById?: string;

  @BelongsTo(() => UserEntity, 'modifiedById')
  declare modifiedByUser?: UserEntity;
}
