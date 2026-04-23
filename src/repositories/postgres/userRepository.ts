import { randomUUID } from 'crypto';
import { Queryable, query } from '../../database/postgres';
import { SafeUser, UserRecord } from '../../types/domain';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: Date;
}

const mapUserRow = (row: UserRow): UserRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
  createdAt: new Date(row.created_at)
});

export class UserRepository {
  public toSafeUser(user: UserRecord): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
  }

  public async createUser(
    input: { name: string; email: string; passwordHash: string; role: 'admin' | 'user' },
    db?: Queryable
  ): Promise<UserRecord> {
    const id = randomUUID();
    const result = await query<UserRow>(
      `
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, password_hash, role, created_at
      `,
      [id, input.name, input.email.toLowerCase(), input.passwordHash, input.role],
      db
    );

    return mapUserRow(result.rows[0]);
  }

  public async findByEmail(email: string, db?: Queryable): Promise<UserRecord | null> {
    const result = await query<UserRow>(
      `
        SELECT id, name, email, password_hash, role, created_at
        FROM users
        WHERE email = $1
      `,
      [email.toLowerCase()],
      db
    );

    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }

  public async findById(id: string, db?: Queryable): Promise<UserRecord | null> {
    const result = await query<UserRow>(
      `
        SELECT id, name, email, password_hash, role, created_at
        FROM users
        WHERE id = $1
      `,
      [id],
      db
    );

    return result.rows[0] ? mapUserRow(result.rows[0]) : null;
  }
}
