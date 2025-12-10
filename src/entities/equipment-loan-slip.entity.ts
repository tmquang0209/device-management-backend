import { BaseEntity } from '@common/database';
import { EEquipmentLoanSlipStatus } from '@common/enums';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { EquipmentLoanSlipDetailEntity } from './equipment-loan-slip-detail.entity';
import { PartnerEntity } from './partner.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'equipment_loan_slip',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class EquipmentLoanSlipEntity extends BaseEntity<EquipmentLoanSlipEntity> {
  @ForeignKey(() => PartnerEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'equipment_borrower_id',
  })
  declare equipmentBorrowerId: string;

  @BelongsTo(() => PartnerEntity, 'equipmentBorrowerId')
  declare borrower?: PartnerEntity;

  @ForeignKey(() => PartnerEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'equipment_loaner_id',
  })
  declare equipmentLoanerId: string;

  @BelongsTo(() => PartnerEntity, 'equipmentLoanerId')
  declare loaner?: PartnerEntity;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'status',
  })
  declare status: EEquipmentLoanSlipStatus;

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

  @HasMany(() => EquipmentLoanSlipDetailEntity)
  declare details?: EquipmentLoanSlipDetailEntity[];
}
