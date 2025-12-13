import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { EquipmentLoanSlipEntity } from './equipment-loan-slip.entity';
import { MaintenanceSlipEntity } from './maintenance-slip.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'partner',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class PartnerEntity extends BaseEntity<PartnerEntity> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'partner_type',
  })
  declare partnerType: number;

  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'user_id',
  })
  declare userId?: string;

  @BelongsTo(() => UserEntity, 'userId')
  declare user?: UserEntity;

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

  @HasMany(() => EquipmentLoanSlipEntity, 'equipmentBorrowerId')
  declare borrowedSlips?: EquipmentLoanSlipEntity[];

  @HasMany(() => EquipmentLoanSlipEntity, 'equipmentLoanerId')
  declare loanedSlips?: EquipmentLoanSlipEntity[];

  @HasMany(() => MaintenanceSlipEntity)
  declare maintenanceSlips?: MaintenanceSlipEntity[];
}
