import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { UserEntity } from './user.entity';
import { BaseEntity } from '@common/database';
import { DeviceEntity } from './device.entity';

@Table({
  tableName: 'supplier',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class SupplierEntity extends BaseEntity<SupplierEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'supplier_name',
  })
  declare supplierName: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'address',
  })
  declare address?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'phone',
  })
  declare phone?: string;

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
