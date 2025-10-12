/**
 * Security Configuration
 * 
 * Centralized security configuration for the BPL Commander application.
 * Includes password policies, session settings, and security headers.
 */

export const securityConfig = {
  // Password Policy
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    maxConsecutiveChars: 3,
    preventCommonPasswords: true,
    preventUserInfoInPassword: true,
    passwordHistoryCount: 5,
    maxPasswordAge: 90, // days
    minPasswordAge: 1, // days
  },

  // Session Management
  session: {
    jwtExpiration: '24h',
    refreshTokenExpiration: '7d',
    maxConcurrentSessions: 3,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // Account Security
  account: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    requireEmailVerification: true,
    requirePhoneVerification: false,
    twoFactorRequired: false,
    passwordResetExpiration: 1 * 60 * 60 * 1000, // 1 hour
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: any) => req.ip,
  },

  // CORS Configuration
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:5173',
      'http://192.168.10.205:3000',
      'http://192.168.10.205:3002',
      'http://192.168.10.205:3003',
      'http://192.168.10.205:5173',
      'http://192.168.29.213:3000',
      'http://192.168.29.213:3002',
      'http://192.168.29.213:5173',
      'http://192.168.10.11:3000',
      'http://192.168.10.11:3002',
      'http://192.168.10.11:5173',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },

  // Security Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';",
  },

  // File Upload Security
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    scanForViruses: true,
    quarantineSuspiciousFiles: true,
  },

  // API Security
  api: {
    requireHttps: process.env.NODE_ENV === 'production',
    enableRequestLogging: true,
    enableResponseLogging: false,
    maxRequestSize: '10mb',
    timeout: 30000, // 30 seconds
  },

  // Database Security
  database: {
    connectionTimeout: 10000, // 10 seconds
    queryTimeout: 30000, // 30 seconds
    maxConnections: 20,
    enableQueryLogging: process.env.NODE_ENV === 'development',
    enableSlowQueryLogging: true,
    slowQueryThreshold: 1000, // 1 second
  },

  // Logging Security
  logging: {
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    logSensitiveData: false,
    logUserActions: true,
    logSecurityEvents: true,
    logPerformanceMetrics: true,
    maxLogFileSize: 10 * 1024 * 1024, // 10MB
    maxLogFiles: 5,
  },

  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },

  // Backup Security
  backup: {
    encryptBackups: true,
    backupRetentionDays: 30,
    backupFrequency: 'daily',
    backupLocation: './backups',
    verifyBackupIntegrity: true,
  },
};

/**
 * Validates security configuration
 * @returns Validation result
 */
export function validateSecurityConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate password policy
  if (securityConfig.password.minLength < 8) {
    errors.push('Password minimum length must be at least 8 characters');
  }

  if (securityConfig.password.maxLength < securityConfig.password.minLength) {
    errors.push('Password maximum length must be greater than minimum length');
  }

  // Validate session configuration
  if (securityConfig.session.maxConcurrentSessions < 1) {
    errors.push('Maximum concurrent sessions must be at least 1');
  }

  // Validate rate limiting
  if (securityConfig.rateLimit.maxRequests < 1) {
    errors.push('Rate limit maximum requests must be at least 1');
  }

  // Validate file upload
  if (securityConfig.fileUpload.maxFileSize < 1024) {
    errors.push('Maximum file size must be at least 1KB');
  }

  if (securityConfig.fileUpload.allowedMimeTypes.length === 0) {
    errors.push('At least one MIME type must be allowed for file uploads');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets security configuration for specific environment
 * @param environment - Environment name
 * @returns Environment-specific security configuration
 */
export function getSecurityConfigForEnvironment(environment: string) {
  const config = { ...securityConfig };

  switch (environment) {
    case 'production':
      // Stricter security for production
      config.password.minLength = 12;
      config.session.jwtExpiration = '8h';
      config.session.maxConcurrentSessions = 1;
      config.account.maxLoginAttempts = 3;
      config.account.lockoutDuration = 30 * 60 * 1000; // 30 minutes
      config.rateLimit.maxRequests = 50;
      config.api.requireHttps = true;
      config.logging.logLevel = 'error';
      break;

    case 'development':
      // More relaxed security for development
      config.password.minLength = 6;
      config.session.jwtExpiration = '24h';
      config.session.maxConcurrentSessions = 5;
      config.account.maxLoginAttempts = 10;
      config.account.lockoutDuration = 5 * 60 * 1000; // 5 minutes
      config.rateLimit.maxRequests = 1000;
      config.api.requireHttps = false;
      config.logging.logLevel = 'debug';
      break;

    case 'test':
      // Minimal security for testing
      config.password.minLength = 4;
      config.session.jwtExpiration = '1h';
      config.session.maxConcurrentSessions = 10;
      config.account.maxLoginAttempts = 100;
      config.account.lockoutDuration = 1000; // 1 second
      config.rateLimit.maxRequests = 10000;
      config.api.requireHttps = false;
      config.logging.logLevel = 'error';
      break;
  }

  return config;
}
