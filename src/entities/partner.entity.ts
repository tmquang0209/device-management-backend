import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'partner',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class PartnerEntity extends BaseEntity<PartnerEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'partner_name',
  })
  declare partnerName: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'partner_type',
  })
  declare partnerType: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'description',
  })
  declare description?: string;

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

  @HasMany(() => UserEntity)
  declare users?: UserEntity[];
}
