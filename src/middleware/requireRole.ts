import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { UserRole } from '../config/constants';

export const requireRole = (...roles: UserRole[]) => (request: Request, _response: Response, next: NextFunction) => {
  if (!request.auth) {
    next(new AppError(401, 'Authentication is required'));
    return;
  }

  if (!roles.includes(request.auth.role)) {
    next(new AppError(403, 'You are not allowed to perform this action'));
    return;
  }

  next();
};
