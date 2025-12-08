import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { DeviceEntity } from './device.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'device_location',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class DeviceLocationEntity extends BaseEntity<DeviceLocationEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'device_location_name',
  })
  declare deviceLocationName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'location',
  })
  declare location?: string;

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

  @HasMany(() => DeviceEntity)
  declare devices?: DeviceEntity[];
}
