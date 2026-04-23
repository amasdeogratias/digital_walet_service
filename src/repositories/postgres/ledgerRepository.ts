import { randomUUID } from 'crypto';
import { Queryable, query } from '../../database/postgres';
import { LedgerEntryRecord } from '../../types/domain';

interface LedgerRow {
  id: string;
  type: 'top_up' | 'transfer';
  amount: number | string;
  currency: string;
  sender_wallet_id: string | null;
  receiver_wallet_id: string | null;
  reference: string;
  idempotency_key: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

const mapLedgerRow = (row: LedgerRow): LedgerEntryRecord => ({
  id: row.id,
  type: row.type,
  amount: Number(row.amount),
  currency: row.currency,
  senderWalletId: row.sender_wallet_id,
  receiverWalletId: row.receiver_wallet_id,
  reference: row.reference,
  idempotencyKey: row.idempotency_key,
  description: row.description,
  metadata: row.metadata,
  createdAt: new Date(row.created_at)
});

export class LedgerRepository {
  public async createEntry(
    input: Omit<LedgerEntryRecord, 'id' | 'createdAt'>,
    db: Queryable
  ): Promise<LedgerEntryRecord> {
    const result = await query<LedgerRow>(
      `
        INSERT INTO ledger_entries (
          id,
          type,
          amount,
          currency,
          sender_wallet_id,
          receiver_wallet_id,
          reference,
          idempotency_key,
          description,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          type,
          amount::float8 AS amount,
          currency,
          sender_wallet_id,
          receiver_wallet_id,
          reference,
          idempotency_key,
          description,
          metadata,
          created_at
      `,
      [
        randomUUID(),
        input.type,
        input.amount,
        input.currency,
        input.senderWalletId,
        input.receiverWalletId,
        input.reference,
        input.idempotencyKey,
        input.description,
        input.metadata ? JSON.stringify(input.metadata) : null
      ],
      db
    );

    return mapLedgerRow(result.rows[0]);
  }

  public async findByReference(reference: string, db?: Queryable): Promise<LedgerEntryRecord | null> {
    const result = await query<LedgerRow>(
      `
        SELECT
          id,
          type,
          amount::float8 AS amount,
          currency,
          sender_wallet_id,
          receiver_wallet_id,
          reference,
          idempotency_key,
          description,
          metadata,
          created_at
        FROM ledger_entries
        WHERE reference = $1
      `,
      [reference],
      db
    );

    return result.rows[0] ? mapLedgerRow(result.rows[0]) : null;
  }

  public async findRecentForWallet(walletId: string, limit = 10, db?: Queryable): Promise<LedgerEntryRecord[]> {
    const result = await query<LedgerRow>(
      `
        SELECT
          id,
          type,
          amount::float8 AS amount,
          currency,
          sender_wallet_id,
          receiver_wallet_id,
          reference,
          idempotency_key,
          description,
          metadata,
          created_at
        FROM ledger_entries
        WHERE sender_wallet_id = $1 OR receiver_wallet_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      [walletId, limit],
      db
    );

    return result.rows.map(mapLedgerRow);
  }
}
