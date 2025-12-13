import { BaseEntity } from '@common/database';
import { EMaintenanceSlipStatus } from '@common/enums';
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
import { MaintenanceSlipDetailEntity } from './maintenance-slip-detail.entity';
import { PartnerEntity } from './partner.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'maintenance_slip',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class MaintenanceSlipEntity extends BaseEntity<MaintenanceSlipEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'code',
  })
  declare code: string;

  @ForeignKey(() => PartnerEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'partner_id',
  })
  declare partnerId?: string;

  @BelongsTo(() => PartnerEntity)
  declare partner?: PartnerEntity;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'reason',
  })
  declare reason?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'request_date',
  })
  declare requestDate?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: EMaintenanceSlipStatus.SENDING,
    field: 'status',
  })
  declare status: EMaintenanceSlipStatus;

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

  @HasMany(() => MaintenanceSlipDetailEntity)
  declare details?: MaintenanceSlipDetailEntity[];

  @BeforeCreate
  static async generateCode(instance: MaintenanceSlipEntity) {
    if (!instance.code) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const datePrefix = `${day}${month}${year}`;

      // Find the count of maintenance slips created today
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      const count = await MaintenanceSlipEntity.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

      const sequence = String(count + 1).padStart(3, '0');
      instance.code = `GDBT_${datePrefix}_${sequence}`;
    }
  }
}
