import { BaseEntity } from '@common/database';
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
import { DeviceLocationEntity } from './device-location.entity';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'rack',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class RackEntity extends BaseEntity<RackEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'code',
  })
  declare code: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'rows',
  })
  declare rows: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'cols',
  })
  declare cols: number;

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
    field: 'modified_by',
  })
  declare modifiedById?: string;

  @BelongsTo(() => UserEntity, 'modifiedById')
  declare modifiedByUser?: UserEntity;

  @HasMany(() => DeviceLocationEntity)
  declare deviceLocations?: DeviceLocationEntity[];

  @BeforeCreate
  static async generateCode(instance: RackEntity) {
    console.log('🚀 ~ RackEntity ~ generateCode ~ instance:', instance);
    if (!instance.code) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const datePrefix = `${day}${month}${year}`;

      // Find the count of racks created today
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      const count = await RackEntity.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

      const sequence = String(count + 1).padStart(2, '0');
      instance.code = `${datePrefix}_${sequence}`;
    }
  }
}
