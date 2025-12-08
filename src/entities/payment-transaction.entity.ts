import { BaseEntity } from '@common/database';
import {
  EPaymentMethod,
  EPaymentStatus,
  EReconciliationStatus,
} from '@common/enums';
import { PaymentProviderEntity, UserEntity } from '@entities';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';

@Table({
  tableName: 'payment_transactions',
})
export class PaymentTransactionEntity extends BaseEntity<PaymentTransactionEntity> {
  // ============================================
  // USER & PROVIDER REFERENCES
  // ============================================

  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare userId: string;

  @ForeignKey(() => PaymentProviderEntity)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare providerId: string;

  // ============================================
  // PAYMENT GATEWAY & EXTERNAL IDs
  // ============================================

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare providerTxnId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare providerRefId: string;

  // ============================================
  // TRANSACTION STATUS & METHOD
  // ============================================

  @Column({
    type: DataType.ENUM(...Object.values(EPaymentStatus)),
    allowNull: false,
    defaultValue: EPaymentStatus.PENDING,
  })
  declare status: EPaymentStatus;

  @Column({
    type: DataType.ENUM(...Object.values(EPaymentMethod)),
    allowNull: false,
    defaultValue: EPaymentMethod.OTHER,
  })
  declare paymentMethod: EPaymentMethod;

  // ============================================
  // AMOUNT & CURRENCY (minor units)
  // ============================================

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
  })
  declare currency: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    comment: 'Amount in minor units (e.g., cents for USD)',
  })
  declare amountMinor: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    defaultValue: 0,
    comment: 'Transaction fee amount',
  })
  declare feeMinor: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    comment: 'Net amount after deducting fees',
  })
  declare netMinor: number;

  // ============================================
  // DESCRIPTION & METADATA
  // ============================================

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare description: string;

  // ============================================
  // IDEMPOTENCY & WEBHOOK VERIFICATION
  // ============================================

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare idempotencyKey: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the webhook signature was verified successfully',
  })
  declare webhookSignatureOk: boolean;

  // ============================================
  // SETTLEMENT & RECONCILIATION
  // ============================================

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Information related to settlement/reconciliation',
  })
  declare settlementDate: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare statementId: string;

  @Column({
    type: DataType.ENUM(...Object.values(EReconciliationStatus)),
    allowNull: false,
    defaultValue: EReconciliationStatus.UNRECONCILED,
    comment: 'Reconciliation status of the transaction',
  })
  declare reconStatus: EReconciliationStatus;

  // ============================================
  // REFUND RELATED
  // ============================================

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare refundData: Record<string, any>;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare parentTxnUid: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare refundReason: string;

  // ============================================
  // TIMESTAMPS
  // ============================================

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare expiredAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare paidAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare refundedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastWebhookAt: Date;

  // ============================================
  // METADATA & EXTENDED FIELDS
  // ============================================

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare metadata: Record<string, any>;

  // ============================================
  // RELATIONSHIPS
  // ============================================

  @BelongsTo(() => UserEntity)
  declare user: UserEntity;

  @BelongsTo(() => PaymentProviderEntity)
  declare provider: PaymentProviderEntity;
}
