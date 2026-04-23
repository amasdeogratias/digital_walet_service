import { Router } from 'express';
import Joi from 'joi';
import { WalletController } from '../controllers/walletController';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { Roles } from '../config/constants';

export const createWalletRoutes = (controller: WalletController): Router => {
  const router = Router();

  router.get('/me', authenticate, controller.getMyWallet);

  router.post(
    '/top-ups',
    authenticate,
    requireRole(Roles.ADMIN),
    validate(
      Joi.object({
        userId: Joi.string().guid({ version: 'uuidv4' }).required(),
        amount: Joi.number().positive().precision(2).required(),
        reason: Joi.string().trim().max(255).optional()
      })
    ),
    controller.adminTopUp
  );

  router.post(
    '/transfers',
    authenticate,
    requireRole(Roles.USER, Roles.ADMIN),
    validate(
      Joi.object({
        recipientUserId: Joi.string().guid({ version: 'uuidv4' }).required(),
        amount: Joi.number().positive().precision(2).required(),
        note: Joi.string().trim().max(255).optional()
      })
    ),
    controller.transfer
  );

  router.post(
    '/top-up-requests',
    authenticate,
    requireRole(Roles.USER, Roles.ADMIN),
    validate(
      Joi.object({
        amount: Joi.number().positive().precision(2).required(),
        reason: Joi.string().trim().max(255).optional()
      })
    ),
    controller.createTopUpRequest
  );

  router.get('/top-up-requests', authenticate, requireRole(Roles.ADMIN), controller.listPendingTopUpRequests);
  router.post('/top-up-requests/:id/approve', authenticate, requireRole(Roles.ADMIN), controller.approveTopUpRequest);

  return router;
};
