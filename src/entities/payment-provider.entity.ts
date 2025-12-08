import { BaseEntity } from '@common/database';
import { PaymentTransactionEntity } from '@entities';
import { Column, DataType, HasMany, Table } from 'sequelize-typescript';

@Table({
  tableName: 'payment_providers',
})
export class PaymentProviderEntity extends BaseEntity<PaymentProviderEntity> {
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  declare code: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare authorizedKey: string;

  @HasMany(() => PaymentTransactionEntity)
  declare transactions: PaymentTransactionEntity[];
}
