import { BaseEntity } from '@common/database';
import { EEquipmentLoanSlipDetailStatus } from '@common/enums';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { DeviceEntity } from './device.entity';
import { EquipmentLoanSlipEntity } from './equipment-loan-slip.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'equipment_loan_slip_detail',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class EquipmentLoanSlipDetailEntity extends BaseEntity<EquipmentLoanSlipDetailEntity> {
  @ForeignKey(() => EquipmentLoanSlipEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'equipment_loan_slip_id',
  })
  declare equipmentLoanSlipId: string;

  @BelongsTo(() => EquipmentLoanSlipEntity)
  declare loanSlip?: EquipmentLoanSlipEntity;

  @ForeignKey(() => DeviceEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'device_id',
  })
  declare deviceId: string;

  @BelongsTo(() => DeviceEntity)
  declare device?: DeviceEntity;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'status',
  })
  declare status: EEquipmentLoanSlipDetailStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'return_date',
  })
  declare returnDate?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'note',
  })
  declare note?: string;

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
