/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables and provides
 * helpful error messages for missing or invalid configurations.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  NOTIFICATION_CHECK_INTERVAL: number;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_SECURE?: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates all required environment variables
 * @returns Validated environment configuration
 * @throws EnvValidationError if validation fails
 */
export function validateEnvironment(): EnvConfig {
  const errors: string[] = [];

  // Required environment variables
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    UPLOAD_DIR: process.env.UPLOAD_DIR,
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    NOTIFICATION_CHECK_INTERVAL: process.env.NOTIFICATION_CHECK_INTERVAL,
  };

  // Check for missing required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long for security');
    }
    if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production') {
      errors.push('JWT_SECRET must be changed from the default value');
    }
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
      errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
    }
  }

  // Validate numeric values
  const numericVars = {
    PORT: process.env.PORT,
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    NOTIFICATION_CHECK_INTERVAL: process.env.NOTIFICATION_CHECK_INTERVAL,
  };

  for (const [key, value] of Object.entries(numericVars)) {
    if (value && isNaN(Number(value))) {
      errors.push(`${key} must be a valid number, got: ${value}`);
    }
  }

  // Validate NODE_ENV
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    errors.push('NODE_ENV must be one of: development, production, test');
  }

  // Validate CORS_ORIGIN format
  if (process.env.CORS_ORIGIN) {
    try {
      new URL(process.env.CORS_ORIGIN);
    } catch {
      errors.push('CORS_ORIGIN must be a valid URL');
    }
  }

  // Check for production security issues
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      errors.push('JWT_SECRET must be at least 64 characters long in production');
    }
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  SMTP configuration missing - email notifications will not work in production');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n📖 Please check your .env file and ensure all required variables are set correctly.');
    console.error('📖 See backend/env.example for reference.');
    
    throw new EnvValidationError(`Environment validation failed: ${errors.join(', ')}`);
  }

  // Return validated configuration
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
    PORT: parseInt(process.env.PORT!, 10),
    NODE_ENV: process.env.NODE_ENV!,
    CORS_ORIGIN: process.env.CORS_ORIGIN!,
    UPLOAD_DIR: process.env.UPLOAD_DIR!,
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE!, 10),
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS!, 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!, 10),
    NOTIFICATION_CHECK_INTERVAL: parseInt(process.env.NOTIFICATION_CHECK_INTERVAL!, 10),
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
  };
}

/**
 * Validates environment variables and exits if validation fails
 * Use this at application startup
 */
export function validateEnvironmentOrExit(): EnvConfig {
  try {
    return validateEnvironment();
  } catch (error) {
    console.error('\n💥 Application startup failed due to environment configuration issues.');
    console.error('💥 Please fix the above errors and restart the application.\n');
    process.exit(1);
  }
}

