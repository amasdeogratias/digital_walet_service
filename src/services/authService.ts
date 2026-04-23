import { Roles } from '../config/constants';
import { env } from '../config/env';
import { withTransaction } from '../database/postgres';
import { AppError } from '../errors/AppError';
import { AuditLogRepository } from '../repositories/mongo/auditLogRepository';
import { UserRepository } from '../repositories/postgres/userRepository';
import { WalletRepository } from '../repositories/postgres/walletRepository';
import { SafeUser } from '../types/domain';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly auditLogRepository: AuditLogRepository
  ) {}

  public async register(input: { name: string; email: string; password: string }): Promise<{
    user: SafeUser;
    token: string;
  }> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, 'Email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await withTransaction(async (db) => {
      const created = await this.userRepository.createUser(
        {
          name: input.name,
          email: input.email,
          passwordHash,
          role: Roles.USER
        },
        db
      );

      await this.walletRepository.createWallet(
        {
          userId: created.id,
          currency: env.defaultCurrency
        },
        db
      );

      return created;
    });

    const safeUser = this.userRepository.toSafeUser(user);
    await this.auditLogRepository.create({
      actorUserId: user.id,
      action: 'user_registered',
      entityType: 'user',
      entityId: user.id,
      status: 'success',
      metadata: { email: user.email }
    });

    return { user: safeUser, token: signToken(safeUser) };
  }

  public async login(input: { email: string; password: string }): Promise<{ user: SafeUser; token: string }> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, 'Invalid email or password');
    }

    const safeUser = this.userRepository.toSafeUser(user);
    await this.auditLogRepository.create({
      actorUserId: user.id,
      action: 'user_logged_in',
      entityType: 'user',
      entityId: user.id,
      status: 'success'
    });

    return {
      user: safeUser,
      token: signToken(safeUser)
    };
  }
}
