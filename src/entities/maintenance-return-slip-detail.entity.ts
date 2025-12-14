// Table maintenance_return_slip_detail [note: 'Chi tiết phiếu nhận lại từ bảo trì'] {
//   id varchar [primary key]
//   maintenance_return_slip_id varchar
//   device_id varchar
//   note varchar [note: 'Tình trạng khi nhận lại']
//   created_by varchar
//   created_at date
//   updated_by varchar
//   updated_at date
// }
import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { DeviceEntity } from './device.entity';
import { MaintenanceReturnSlipEntity } from './maintenance-return-slip.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'maintenance_return_slip_detail',
  timestamps: true,
})
export class MaintenanceReturnSlipDetailEntity extends BaseEntity<MaintenanceReturnSlipDetailEntity> {
  @ForeignKey(() => MaintenanceReturnSlipEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'maintenance_return_slip_id',
  })
  declare maintenanceReturnSlipId: string;

  @ForeignKey(() => DeviceEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'device_id',
  })
  declare deviceId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'note',
  })
  declare note?: string;

  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'created_by',
  })
  declare createdBy: string;

  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'updated_by',
  })
  declare updatedBy?: string;

  @BelongsTo(() => MaintenanceReturnSlipEntity, 'maintenanceReturnSlipId')
  declare maintenanceReturnSlip?: MaintenanceReturnSlipEntity;

  @BelongsTo(() => DeviceEntity, 'deviceId')
  declare device?: DeviceEntity;

  @BelongsTo(() => UserEntity, 'createdBy')
  declare creator?: UserEntity;

  @BelongsTo(() => UserEntity, 'updatedBy')
  declare updater?: UserEntity;
}
