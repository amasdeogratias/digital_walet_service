import dotenv from 'dotenv';

dotenv.config();

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const numberValue = (key: string, fallback: number): number => {
  const rawValue = process.env[key];
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberValue('PORT', 3000),
  postgresUrl: required('POSTGRES_URL', 'postgresql://postgres:postgres@localhost:5432/wallet_service'),
  mongodbUrl: required('MONGODB_URL', 'mongodb://localhost:27017/wallet_service'),
  jwtSecret: required('JWT_SECRET', 'super-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  transferMinAmount: numberValue('TRANSFER_MIN_AMOUNT', 10),
  transferMaxAmount: numberValue('TRANSFER_MAX_AMOUNT', 10000),
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? 'KES',
  adminEmail: required('ADMIN_EMAIL', 'admin@wallet.com'),
  adminPassword: required('ADMIN_PASSWORD', 'Admin123!'),
  demoUserPassword: required('DEMO_USER_PASSWORD', 'User12345!')
};
