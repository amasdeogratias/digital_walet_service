export const Roles = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export const LedgerEntryTypes = {
  TOP_UP: 'top_up',
  TRANSFER: 'transfer'
} as const;

export const TopUpRequestStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type UserRole = (typeof Roles)[keyof typeof Roles];
export type LedgerEntryType = (typeof LedgerEntryTypes)[keyof typeof LedgerEntryTypes];
export type TopUpRequestStatus = (typeof TopUpRequestStatuses)[keyof typeof TopUpRequestStatuses];
