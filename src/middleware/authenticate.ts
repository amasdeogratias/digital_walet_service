import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { verifyToken } from '../utils/jwt';

export const authenticate = (request: Request, _response: Response, next: NextFunction): void => {
  const authorization = request.header('Authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication is required'));
    return;
  }

  const token = authorization.replace('Bearer ', '').trim();

  try {
    const payload = verifyToken(token);
    request.auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email
    };
    next();
  } catch (_error) {
    next(new AppError(401, 'Invalid or expired token'));
  }
};
