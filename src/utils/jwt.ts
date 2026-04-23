import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthTokenPayload, SafeUser } from '../types/domain';

export const signToken = (user: SafeUser): string =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn as SignOptions['expiresIn']
    }
  );

export const verifyToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
