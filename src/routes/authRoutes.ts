import { Router } from 'express';
import Joi from 'joi';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validate';

export const createAuthRoutes = (controller: AuthController): Router => {
  const router = Router();

  const registerSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).max(128).required()
  });

  const loginSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  });

  router.post('/register', validate(registerSchema), controller.register);
  router.post('/login', validate(loginSchema), controller.login);

  return router;
};
