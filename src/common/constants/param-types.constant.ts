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
  MAINTENANCE_SLIP_DETAIL_STATUS: 'MAINTENANCE_SLIP_DETAIL_STATUS',
  MAINTENANCE_SLIP_PREFIX: 'MAINTENANCE_SLIP_PREFIX',
  MAINTENANCE_RETURN_SLIP_STATUS: 'MAINTENANCE_RETURN_SLIP_STATUS',
  MAINTENANCE_RETURN_SLIP_DETAIL_STATUS:
    'MAINTENANCE_RETURN_SLIP_DETAIL_STATUS',
  MAINTENANCE_RETURN_SLIP_PREFIX: 'MAINTENANCE_RETURN_SLIP_PREFIX',
  PARTNER_TYPE: 'PARTNER_TYPE',
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

/**
 * Default Maintenance Return Slip Status configurations
 * These will be auto-initialized in the param table if not exists
 */
export const DEFAULT_MAINTENANCE_RETURN_SLIP_STATUS = [
  { code: '1', value: 'Đã nhập kho', status: 1 },
  { code: '2', value: 'Đã hủy', status: 1 },
] as const;

/**
 * Default Maintenance Return Slip Detail Status configurations
 * These will be auto-initialized in the param table if not exists
 */
export const DEFAULT_MAINTENANCE_RETURN_SLIP_DETAIL_STATUS = [
  { code: '2', value: 'Đã trả (Hoạt động)', status: 1 },
  { code: '3', value: 'Hỏng', status: 1 },
] as const;

/**
 * Default Maintenance Return Slip Prefix configuration
 */
export const DEFAULT_MAINTENANCE_RETURN_SLIP_PREFIX = [
  { code: 'PREFIX', value: 'PNBT', status: 1 },
] as const;

/**
 * Default Maintenance Slip Status configurations
 * These will be auto-initialized in the param table if not exists
 */
export const DEFAULT_MAINTENANCE_SLIP_STATUS = [
  { code: '1', value: 'Đang gửi bảo trì', status: 1 },
  { code: '2', value: 'Đã đóng', status: 1 },
  { code: '3', value: 'Đã hủy', status: 1 },
  { code: '4', value: 'Chưa hoàn tất nhận', status: 1 },
] as const;

/**
 * Default Maintenance Slip Detail Status configurations
 * These will be auto-initialized in the param table if not exists
 */
export const DEFAULT_MAINTENANCE_SLIP_DETAIL_STATUS = [
  { code: '1', value: 'Đang gửi', status: 1 },
  { code: '2', value: 'Đã trả (Hoạt động)', status: 1 },
  { code: '3', value: 'Hỏng', status: 1 },
] as const;

/**
 * Default Maintenance Slip Prefix configuration
 */
export const DEFAULT_MAINTENANCE_SLIP_PREFIX = [
  { code: 'PREFIX', value: 'PXBT', status: 1 },
] as const;

/**
 * Default Partner Type configurations
 * These will be auto-initialized in the param table if not exists
 */
export const DEFAULT_PARTNER_TYPE = [
  { code: '1', value: 'Đối tượng bảo trì', status: 1 },
  { code: '2', value: 'Đối tượng mượn', status: 1 },
] as const;
