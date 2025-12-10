import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { RackEntity } from './rack.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'device_location',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class DeviceLocationEntity extends BaseEntity<DeviceLocationEntity> {
  @ForeignKey(() => RackEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'rack_id',
  })
  declare rackId: string;

  @BelongsTo(() => RackEntity)
  declare rack?: RackEntity;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'x_position',
  })
  declare xPosition?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'y_position',
  })
  declare yPosition?: string;

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
