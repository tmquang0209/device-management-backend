import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { DeviceLocationEntity } from './device-location.entity';
import { DeviceEntity } from './device.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'rack',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class RackEntity extends BaseEntity<RackEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'code',
  })
  declare code: string;

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

  @HasMany(() => DeviceLocationEntity)
  declare deviceLocations?: DeviceLocationEntity[];
}
