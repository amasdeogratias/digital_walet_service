import { Pool, PoolClient, QueryResultRow } from 'pg';
import { env } from '../config/env';

export type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

const pool = new Pool({
  connectionString: env.postgresUrl
});

export const getPostgresPool = (): Pool => pool;

export const query = async <T extends QueryResultRow>(text: string, values?: unknown[], db: Queryable = pool) =>
  db.query<T>(text, values);

export const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const closePostgres = async (): Promise<void> => {
  await pool.end();
};
