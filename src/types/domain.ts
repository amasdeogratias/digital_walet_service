import { LedgerEntryType, TopUpRequestStatus, UserRole } from '../config/constants';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface WalletRecord {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntryRecord {
  id: string;
  type: LedgerEntryType;
  amount: number;
  currency: string;
  senderWalletId: string | null;
  receiverWalletId: string | null;
  reference: string;
  idempotencyKey: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLogRecord {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  status: 'success' | 'failed';
  metadata?: Record<string, unknown>;
}

export interface TopUpRequestRecord {
  id: string;
  requesterUserId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: TopUpRequestStatus;
  reviewedByUserId?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export interface AuthContext {
  userId: string;
  role: UserRole;
  email: string;
}
