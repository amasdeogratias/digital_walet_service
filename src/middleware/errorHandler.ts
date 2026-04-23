import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export const notFoundHandler = (_request: Request, _response: Response, next: NextFunction): void => {
  next(new AppError(404, 'Route not found'));
};

export const errorHandler = (error: Error, request: Request, response: Response, _next: NextFunction): void => {
  const appError = error instanceof AppError ? error : new AppError(500, 'Internal server error', undefined, false);

  if (appError.statusCode >= 500) {
    console.error(
      JSON.stringify({
        requestId: request.requestId,
        message: error.message,
        stack: error.stack
      })
    );
  }

  response.status(appError.statusCode).json({
    message: appError.message,
    requestId: request.requestId,
    details: appError.details
  });
};
