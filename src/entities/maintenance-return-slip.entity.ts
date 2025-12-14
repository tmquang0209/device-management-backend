// Table maintenance_return_slip [note: 'Phiếu nhận lại thiết bị từ bảo trì'] {
//   id varchar [primary key]
//   code varchar
//   maintenance_slip_id varchar [note: 'Phiếu xuất bảo trì']
//   status number [note: '1. Đã nhập kho 2. Đã hủy']
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
  HasMany,
  Table,
} from 'sequelize-typescript';
import { MaintenanceReturnSlipDetailEntity } from './maintenance-return-slip-detail.entity';
import { MaintenanceSlipEntity } from './maintenance-slip.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'maintenance_return_slip',
  timestamps: true,
})
export class MaintenanceReturnSlipEntity extends BaseEntity<MaintenanceReturnSlipEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'code',
  })
  declare code: string;

  @ForeignKey(() => MaintenanceSlipEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'maintenance_slip_id',
  })
  declare maintenanceSlipId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'status',
  })
  declare status: number;

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

  @BelongsTo(() => MaintenanceSlipEntity, 'maintenanceSlipId')
  declare maintenanceSlip?: MaintenanceSlipEntity;

  @BelongsTo(() => UserEntity, 'createdBy')
  declare creator?: UserEntity;

  @BelongsTo(() => UserEntity, 'updatedBy')
  declare updater?: UserEntity;

  @HasMany(() => MaintenanceReturnSlipDetailEntity, 'maintenanceReturnSlipId')
  declare maintenanceReturnSlipDetails?: MaintenanceReturnSlipDetailEntity[];
}
