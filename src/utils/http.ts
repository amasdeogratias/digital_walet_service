import { Request } from 'express';

export const getIdempotencyKey = (request: Request): string | undefined => {
  const rawHeader = request.header('Idempotency-Key') ?? request.header('idempotency-key');
  return rawHeader?.trim() || undefined;
};
