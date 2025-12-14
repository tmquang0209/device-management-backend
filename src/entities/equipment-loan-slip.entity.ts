import { BaseEntity } from '@common/database';
import { EEquipmentLoanSlipStatus } from '@common/enums';
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
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'code',
  })
  declare code: string;

  @ForeignKey(() => PartnerEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'equipment_borrower_id',
  })
  declare equipmentBorrowerId: string;

  @BelongsTo(() => PartnerEntity, 'equipmentBorrowerId')
  declare borrower?: PartnerEntity;

  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'equipment_loaner_id',
  })
  declare equipmentLoanerId: string;

  @BelongsTo(() => UserEntity, 'equipmentLoanerId')
  declare loaner?: UserEntity;

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
    field: 'updated_by',
  })
  declare updatedById?: string;

  @BelongsTo(() => UserEntity, 'updatedById')
  declare updatedByUser?: UserEntity;

  @HasMany(() => EquipmentLoanSlipDetailEntity)
  declare details?: EquipmentLoanSlipDetailEntity[];

  @BeforeCreate
  static async generateCode(instance: EquipmentLoanSlipEntity) {
    if (!instance.code) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const datePrefix = `${day}${month}${year}`;

      // Find the count of racks created today
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      const count = await EquipmentLoanSlipEntity.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

      const sequence = String(count + 1).padStart(3, '0');
      instance.code = `GDXM_${datePrefix}_${sequence}`;
    }
  }
}
