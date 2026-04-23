import { randomUUID } from 'crypto';
import { Queryable, query } from '../../database/postgres';
import { WalletRecord } from '../../types/domain';

interface WalletRow {
  id: string;
  user_id: string;
  balance: number | string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

const mapWalletRow = (row: WalletRow): WalletRecord => ({
  id: row.id,
  userId: row.user_id,
  balance: Number(row.balance),
  currency: row.currency,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

export class WalletRepository {
  public async createWallet(input: { userId: string; currency: string }, db?: Queryable): Promise<WalletRecord> {
    const result = await query<WalletRow>(
      `
        INSERT INTO wallets (id, user_id, currency)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, balance::float8 AS balance, currency, created_at, updated_at
      `,
      [randomUUID(), input.userId, input.currency],
      db
    );

    return mapWalletRow(result.rows[0]);
  }

  public async findByUserId(userId: string, db?: Queryable): Promise<WalletRecord | null> {
    const result = await query<WalletRow>(
      `
        SELECT id, user_id, balance::float8 AS balance, currency, created_at, updated_at
        FROM wallets
        WHERE user_id = $1
      `,
      [userId],
      db
    );

    return result.rows[0] ? mapWalletRow(result.rows[0]) : null;
  }

  public async getWalletsByUserIdsForUpdate(userIds: string[], db: Queryable): Promise<WalletRecord[]> {
    const result = await query<WalletRow>(
      `
        SELECT id, user_id, balance::float8 AS balance, currency, created_at, updated_at
        FROM wallets
        WHERE user_id = ANY($1::uuid[])
        ORDER BY user_id
        FOR UPDATE
      `,
      [userIds],
      db
    );

    return result.rows.map(mapWalletRow);
  }

  public async updateBalance(walletId: string, balance: number, db: Queryable): Promise<WalletRecord> {
    const result = await query<WalletRow>(
      `
        UPDATE wallets
        SET balance = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING id, user_id, balance::float8 AS balance, currency, created_at, updated_at
      `,
      [walletId, balance],
      db
    );

    return mapWalletRow(result.rows[0]);
  }
}
