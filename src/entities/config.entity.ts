import { BaseEntity } from '@common/database';
import { Column, DataType, Table } from 'sequelize-typescript';

@Table({
  tableName: 'configs',
})
export class ConfigEntity extends BaseEntity<ConfigEntity> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare key: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare value: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare description?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Data type of the config value (e.g., string, number, boolean)',
  })
  declare valueType?: string;
}
