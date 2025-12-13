/**
 * @deprecated The supplier field in DeviceEntity has been changed from a foreign key to a simple VARCHAR field.
 * This entity is no longer used in the new schema. Supplier information is now stored as text in the device table.
 * This file will be removed in a future version.
 */
import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { UserEntity } from './user.entity';

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
    field: 'updated_by',
  })
  declare updatedById?: string;

  @BelongsTo(() => UserEntity, 'updatedById')
  declare updatedByUser?: UserEntity;
}
