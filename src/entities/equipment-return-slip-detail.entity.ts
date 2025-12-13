import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { DeviceEntity } from './device.entity';
import { EquipmentReturnSlipEntity } from './equipment-return-slip.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'equipment_return_slip_detail',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class EquipmentReturnSlipDetailEntity extends BaseEntity<EquipmentReturnSlipDetailEntity> {
  @ForeignKey(() => EquipmentReturnSlipEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'equipment_return_slip_id',
  })
  declare equipmentReturnSlipId: string;

  @BelongsTo(() => EquipmentReturnSlipEntity)
  declare returnSlip?: EquipmentReturnSlipEntity;

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
    field: 'updated_by',
  })
  declare updatedById?: string;

  @BelongsTo(() => UserEntity, 'updatedById')
  declare updatedByUser?: UserEntity;
}
