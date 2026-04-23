import { env } from '../../config/env';
import { Roles } from '../../config/constants';
import { closePostgres, withTransaction } from '../../database/postgres';
import { UserRepository } from '../../repositories/postgres/userRepository';
import { WalletRepository } from '../../repositories/postgres/walletRepository';
import { hashPassword } from '../../utils/password';

const run = async (): Promise<void> => {
  const userRepository = new UserRepository();
  const walletRepository = new WalletRepository();

  await withTransaction(async (db) => {
    const usersToSeed = [
      {
        name: 'System Admin',
        email: env.adminEmail,
        password: env.adminPassword,
        role: Roles.ADMIN
      },
      {
        name: 'Alice Wallet',
        email: 'alice@wallet.local',
        password: env.demoUserPassword,
        role: Roles.USER
      },
      {
        name: 'Bob Wallet',
        email: 'bob@wallet.local',
        password: env.demoUserPassword,
        role: Roles.USER
      }
    ];

    for (const user of usersToSeed) {
      const existing = await userRepository.findByEmail(user.email, db);
      if (existing) {
        continue;
      }

      const created = await userRepository.createUser(
        {
          name: user.name,
          email: user.email,
          passwordHash: await hashPassword(user.password),
          role: user.role
        },
        db
      );

      await walletRepository.createWallet(
        {
          userId: created.id,
          currency: env.defaultCurrency
        },
        db
      );
    }
  });

  await closePostgres();
  console.log('Seed completed successfully');
};

run().catch(async (error) => {
  console.error('Seed failed', error);
  await closePostgres();
  process.exit(1);
});
