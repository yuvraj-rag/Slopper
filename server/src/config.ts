import dotenv from 'dotenv';

dotenv.config();

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  USDA_API_KEY: getRequiredEnv('USDA_API_KEY'),
  OFF_USER_AGENT: getRequiredEnv('OFF_USER_AGENT'),
  ALLOWED_ORIGIN: getRequiredEnv('ALLOWED_ORIGIN'),
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  CACHE_TTL_MS: process.env.CACHE_TTL_MS ? parseInt(process.env.CACHE_TTL_MS, 10) : 300000,
  UPSTREAM_TIMEOUT_MS: process.env.UPSTREAM_TIMEOUT_MS ? parseInt(process.env.UPSTREAM_TIMEOUT_MS, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development'
};
