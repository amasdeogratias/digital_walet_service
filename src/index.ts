import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { createAuthRoutes } from './routes/authRoutes';
import { createWalletRoutes } from './routes/walletRoutes';
import { createAuditRoutes } from './routes/auditRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { AuditController } from './controllers/auditController';
import { AuthController } from './controllers/authController';
import { WalletController } from './controllers/walletController';

export interface AppControllers {
  authController: AuthController;
  walletController: WalletController;
  auditController: AuditController;
}

export const createApp = (controllers: AppControllers) => {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(cors());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100
    })
  );
  app.use(morgan('combined'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/auth', createAuthRoutes(controllers.authController));
  app.use('/api/v1/wallets', createWalletRoutes(controllers.walletController));
  app.use('/api/v1/audit-logs', createAuditRoutes(controllers.auditController));
  app.use(
    '/soap',
    express.text({
      type: ['text/xml', 'application/soap+xml', 'application/xml']
    })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
