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
  tableName: 'param',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class ParamEntity extends BaseEntity<ParamEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'type',
  })
  declare type: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'code',
  })
  declare code: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'value',
  })
  declare value: string;

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
