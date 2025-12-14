/**
 * Param Type Constants
 * Defines the types used in the param table for configuration
 */
export const PARAM_TYPES = {
  LOAN_SLIP_STATUS: 'LOAN_SLIP_STATUS',
  LOAN_SLIP_DETAIL_STATUS: 'LOAN_SLIP_DETAIL_STATUS',
  DEVICE_STATUS: 'DEVICE_STATUS',
  RETURN_SLIP_STATUS: 'RETURN_SLIP_STATUS',
  WARRANTY_STATUS: 'WARRANTY_STATUS',
  MAINTENANCE_SLIP_STATUS: 'MAINTENANCE_SLIP_STATUS',
} as const;

/**
 * Default Loan Slip Status configurations
 * These will be auto-initialized in the param table if not exists
 */
export const DEFAULT_LOAN_SLIP_STATUS = [
  { code: '1', value: 'Đang mượn', status: 1 },
  { code: '2', value: 'Đã nhập kho', status: 1 },
  { code: '3', value: 'Đã hủy', status: 1 },
  { code: '4', value: 'Chưa hoàn tất nhập kho', status: 1 },
] as const;

/**
 * Default Loan Slip Detail Status configurations
 * These will be auto-initialized in the param table if not exists
 */
export const DEFAULT_LOAN_SLIP_DETAIL_STATUS = [
  { code: '1', value: 'Đang mượn', status: 1 },
  { code: '2', value: 'Đã trả', status: 1 },
] as const;
