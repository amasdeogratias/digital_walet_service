import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { AppError } from '../errors/AppError';

type RequestProperty = 'body' | 'params' | 'query';

export const validate = (schema: Joi.ObjectSchema, property: RequestProperty = 'body') => {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(request[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      next(
        new AppError(
          400,
          'Validation failed',
          error.details.map((detail) => detail.message)
        )
      );
      return;
    }

    (request as unknown as Record<RequestProperty, unknown>)[property] = value;
    next();
  };
};
