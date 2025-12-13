import { BaseEntity } from '@common/database';
import { EEquipmentReturnSlipStatus } from '@common/enums';
import { Op } from 'sequelize';
import {
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { EquipmentLoanSlipEntity } from './equipment-loan-slip.entity';
import { EquipmentReturnSlipDetailEntity } from './equipment-return-slip-detail.entity';
import { PartnerEntity } from './partner.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'equipment_return_slip',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class EquipmentReturnSlipEntity extends BaseEntity<EquipmentReturnSlipEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'code',
  })
  declare code: string;

  @ForeignKey(() => EquipmentLoanSlipEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'equipment_loan_slip_id',
  })
  declare equipmentLoanSlipId: string;

  @BelongsTo(() => EquipmentLoanSlipEntity, 'equipmentLoanSlipId')
  declare loanSlip?: EquipmentLoanSlipEntity;

  @ForeignKey(() => PartnerEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'returner_id',
  })
  declare returnerId: string;

  @BelongsTo(() => PartnerEntity, 'returnerId')
  declare returner?: PartnerEntity;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'return_date',
  })
  declare returnDate: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'status',
  })
  declare status: EEquipmentReturnSlipStatus;

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

  @HasMany(() => EquipmentReturnSlipDetailEntity)
  declare details?: EquipmentReturnSlipDetailEntity[];

  @BeforeCreate
  static async generateCode(instance: EquipmentReturnSlipEntity) {
    if (!instance.code) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const datePrefix = `${day}${month}${year}`;

      // Find the count of return slips created today
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await EquipmentReturnSlipEntity.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

      const sequence = String(count + 1).padStart(3, '0');
      instance.code = `GDNT_${datePrefix}_${sequence}`;
    }
  }
}
