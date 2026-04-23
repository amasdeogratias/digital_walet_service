import { Router } from 'express';
import { AuditController } from '../controllers/auditController';
import { Roles } from '../config/constants';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

export const createAuditRoutes = (controller: AuditController): Router => {
  const router = Router();
  router.get('/', authenticate, requireRole(Roles.ADMIN), controller.listRecent);
  return router;
};
