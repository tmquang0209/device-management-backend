import { BaseEntity } from '@common/database';
import { EUserRole } from '@common/enums';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { DeviceEntity } from './device.entity';
import { EquipmentLoanSlipEntity } from './equipment-loan-slip.entity';
import { PartnerEntity } from './partner.entity';

@Table({
  tableName: 'user',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class UserEntity extends BaseEntity<UserEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'name',
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    field: 'user_name',
  })
  declare userName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
    field: 'email',
  })
  declare email?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'password',
  })
  declare password: string;

  @Column({
    type: DataType.ENUM(...Object.values(EUserRole)),
    allowNull: false,
    field: 'role_type',
    defaultValue: EUserRole.STAFF,
  })
  declare roleType: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'status',
  })
  declare status: boolean;

  @ForeignKey(() => PartnerEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'partner_id',
  })
  declare partnerId?: string;

  @BelongsTo(() => PartnerEntity)
  declare partner?: PartnerEntity;

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

  // Relations
  @HasMany(() => DeviceEntity, 'createdById')
  declare devicesCreated?: DeviceEntity[];

  @HasMany(() => EquipmentLoanSlipEntity, 'equipmentBorrowerId')
  declare borrowedSlips?: EquipmentLoanSlipEntity[];

  @HasMany(() => EquipmentLoanSlipEntity, 'equipmentLoanerId')
  declare loanedSlips?: EquipmentLoanSlipEntity[];
}
