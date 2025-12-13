/**
 * Device Status Enum
 * 1: AVAILABLE - Device is available for loan
 * 2: ON_LOAN - Device is currently loaned out
 * 3: UNDER_WARRANTY - Device is under warranty
 * 4: BROKEN - Device is broken
 * 5: MAINTENANCE - Device is in maintenance
 */
export enum EDeviceStatus {
  AVAILABLE = 1,
  ON_LOAN = 2,
  UNDER_WARRANTY = 3,
  BROKEN = 4,
  MAINTENANCE = 5,
}

/**
 * Equipment Loan Slip Status Enum
 * 1: BORROWING - Loan slip is active, device is borrowed
 * 2: CLOSED - Loan slip is closed, all devices returned
 * 3: CANCELLED - Loan slip is cancelled
 * 4: PARTIAL_RETURNED - Some devices have been returned, but not all
 */
export enum EEquipmentLoanSlipStatus {
  BORROWING = 1,
  CLOSED = 2,
  CANCELLED = 3,
  PARTIAL_RETURNED = 4,
}

/**
 * Equipment Loan Slip Detail Status Enum
 * 1: BORROWED - Device is borrowed, not returned yet
 * 2: RETURNED - Device is returned in normal condition
 * 3: BROKEN - Device is returned in broken condition
 */
export enum EEquipmentLoanSlipDetailStatus {
  BORROWED = 1,
  RETURNED = 2,
  BROKEN = 3,
}

/**
 * Equipment Return Slip Status Enum
 * 1: RETURNED - Return slip is completed, devices returned to warehouse
 * 2: CANCELLED - Return slip is cancelled
 */
export enum EEquipmentReturnSlipStatus {
  RETURNED = 1,
  CANCELLED = 2,
}

/**
 * Warranty Status Enum
 * 1: PENDING - Warranty request is pending
 * 2: PROCESSING - Warranty is being processed
 * 3: COMPLETED - Warranty is completed
 * 4: REJECTED - Warranty request is rejected
 */
export enum EWarrantyStatus {
  PENDING = 1,
  PROCESSING = 2,
  COMPLETED = 3,
  REJECTED = 4,
}

/**
 * Partner Type Enum
 * 1: INDIVIDUAL - Individual partner
 * 2: ORGANIZATION - Organization partner
 */
export enum EPartnerType {
  INDIVIDUAL = 1,
  ORGANIZATION = 2,
}

/**
 * Common Status Enum for Param, Partner, Supplier
 * 1: ACTIVE - Entity is active
 * 2: INACTIVE - Entity is inactive
 */
export enum ECommonStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

/**
 * Maintenance Slip Status Enum
 * 1: SENDING - Maintenance slip is active, device is sent for maintenance
 * 2: CLOSED - Maintenance slip is closed, all devices returned from maintenance
 * 3: CANCELLED - Maintenance slip is cancelled
 * 4: PARTIAL_RETURNED - Some devices have been returned from maintenance, but not all
 */
export enum EMaintenanceSlipStatus {
  SENDING = 1,
  CLOSED = 2,
  CANCELLED = 3,
  PARTIAL_RETURNED = 4,
}

/**
 * Maintenance Slip Detail Status Enum
 * 1: SENT - Device is sent for maintenance, not returned yet
 * 2: RETURNED - Device is returned from maintenance in normal condition
 * 3: BROKEN - Device cannot be repaired, marked as broken
 */
export enum EMaintenanceSlipDetailStatus {
  SENT = 1,
  RETURNED = 2,
  BROKEN = 3,
}
