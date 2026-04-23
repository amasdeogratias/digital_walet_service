import { AuditController } from './controllers/auditController';
import { AuthController } from './controllers/authController';
import { WalletController } from './controllers/walletController';
import { createApp } from './index';
import { AuditLogRepository } from './repositories/mongo/auditLogRepository';
import { TopUpRequestRepository } from './repositories/mongo/topUpRequestRepository';
import { LedgerRepository } from './repositories/postgres/ledgerRepository';
import { UserRepository } from './repositories/postgres/userRepository';
import { WalletRepository } from './repositories/postgres/walletRepository';
import { AuditService } from './services/auditService';
import { AuthService } from './services/authService';
import { WalletService } from './services/walletService';

export const buildApplication = () => {
  const userRepository = new UserRepository();
  const walletRepository = new WalletRepository();
  const ledgerRepository = new LedgerRepository();
  const auditLogRepository = new AuditLogRepository();
  const topUpRequestRepository = new TopUpRequestRepository();

  const authService = new AuthService(userRepository, walletRepository, auditLogRepository);
  const walletService = new WalletService(
    userRepository,
    walletRepository,
    ledgerRepository,
    auditLogRepository,
    topUpRequestRepository
  );
  const auditService = new AuditService(auditLogRepository);

  const authController = new AuthController(authService);
  const walletController = new WalletController(walletService);
  const auditController = new AuditController(auditService);

  return createApp({
    authController,
    walletController,
    auditController
  });
};
