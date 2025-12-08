/**
 * Payment status enumeration.
 */
export enum EPaymentStatus {
  CREATED = 'created',
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CHARGEBACK = 'chargeback',
}

export enum EPaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  E_WALLET = 'e_wallet',
  QR = 'qr',
  PAYPAL_BALANCE = 'paypal_balance',
  OTHER = 'other',
}

export enum EReconciliationStatus {
  UNRECONCILED = 'unreconciled',
  MATCHED = 'matched',
  MISMATCHED = 'mismatched',
}
