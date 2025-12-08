import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { DeviceEntity } from './device.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'warranty',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class WarrantyEntity extends BaseEntity<WarrantyEntity> {
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
