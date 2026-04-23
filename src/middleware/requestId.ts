import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const requestIdMiddleware = (request: Request, response: Response, next: NextFunction): void => {
  const requestId = request.header('X-Request-Id') || randomUUID();
  request.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  next();
};
