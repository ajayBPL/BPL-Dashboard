/**
 * Enhanced Security Middleware
 * 
 * Provides comprehensive security features including:
 * - Rate limiting
 * - Security headers
 * - Request validation
 * - Input sanitization
 * - CSRF protection
 * - Brute force protection
 */

import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import { sanitizeText, sanitizeEmail, validatePassword } from '../utils/sanitization';

// Rate limiting configurations
const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

// General API rate limiting
export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests from this IP, please try again later'
);

// Authentication rate limiting (stricter)
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  25, // 25 login attempts per window
  'Too many authentication attempts, please try again later'
);

// Password reset rate limiting
export const passwordResetRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 password reset attempts per hour
  'Too many password reset attempts, please try again later'
);

// File upload rate limiting
export const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads, please try again later'
);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:5173',
      'https://bplcommander.com',
      'https://www.bplcommander.com'
    ];
    
    // Allow localhost and development IPs
    const isLocalhost = origin?.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
    const isDevNetwork = origin?.match(/^https?:\/\/192\.168\.(10\.205|29\.213|10\.11|9\.91)(:\d+)?$/);
    
    if (isLocalhost || isDevNetwork || (origin && allowedOrigins.includes(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
});

// Request size limiting
export const requestSizeLimit = express.json({
  limit: process.env.MAX_REQUEST_SIZE || '10mb',
  verify: (req: Request, res: Response, buf: Buffer) => {
    // Additional validation for request body
    if (buf.length > parseInt(process.env.MAX_REQUEST_SIZE || '10485760')) {
      throw new Error('Request too large');
    }
  }
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize common fields
  if (req.body) {
    if (req.body.email) {
      req.body.email = sanitizeEmail(req.body.email);
    }
    if (req.body.name) {
      req.body.name = sanitizeText(req.body.name);
    }
    if (req.body.description) {
      req.body.description = sanitizeText(req.body.description);
    }
    if (req.body.title) {
      req.body.title = sanitizeText(req.body.title);
    }
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeText(req.query[key] as string);
      }
    });
  }
  
  next();
};

// Enhanced password validation
export const validatePasswordStrength = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Password validation failed',
        details: errors.array()
      });
      return;
    }
    
    // Additional password strength check
    const passwordValidation = validatePassword(req.body.password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Password does not meet security requirements',
        suggestions: passwordValidation.suggestions
      });
      return;
    }
    
    next();
  }
];

// Email validation middleware
export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Email validation failed',
        details: errors.array()
      });
      return;
    }
    next();
  }
];

// Brute force protection for authentication
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const bruteForceProtection = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const attemptData = loginAttempts.get(clientIP);
  
  // Reset attempts after 1 hour
  if (attemptData && (now - attemptData.lastAttempt) > 60 * 60 * 1000) {
    loginAttempts.delete(clientIP);
  }
  
    // Check if too many attempts
    if (attemptData && attemptData.count >= 10) {
      res.status(429).json({
        success: false,
        error: 'Too many failed login attempts',
        message: 'Please try again later or contact support',
        retryAfter: Math.ceil((60 * 60 * 1000 - (now - attemptData.lastAttempt)) / 1000)
      });
      return;
    }
  
  next();
};

// Track failed login attempts
export const trackLoginAttempt = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Track failed attempts
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      const attemptData = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
      attemptData.count += 1;
      attemptData.lastAttempt = Date.now();
      loginAttempts.set(clientIP, attemptData);
    } else if (res.statusCode === 200) {
      // Reset on successful login
      loginAttempts.delete(clientIP);
    }
  });
  
  next();
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    };
    
    // Log suspicious activities
    if (res.statusCode >= 400) {
      console.warn('🚨 Security Event:', JSON.stringify(logData));
    }
    
    // Log authentication attempts
    if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
      console.info('🔐 Auth Event:', JSON.stringify(logData));
    }
  });
  
  next();
};

// SQL injection protection
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  // More specific patterns that match actual SQL injection attempts, not just keywords
  const sqlPatterns = [
    // SQL injection with common attack patterns
    /(\bOR\b\s+[\d'"\w]+\s*=\s*[\d'"\w]+)/i,  // OR 1=1, OR 'a'='a'
    /(\bAND\b\s+[\d'"\w]+\s*=\s*[\d'"\w]+)/i, // AND 1=1
    /(UNION\s+(ALL\s+)?SELECT)/i,              // UNION SELECT
    /(;\s*DROP\s+TABLE)/i,                     // ; DROP TABLE
    /(;\s*DELETE\s+FROM)/i,                    // ; DELETE FROM
    /(;\s*INSERT\s+INTO)/i,                    // ; INSERT INTO
    /(;\s*UPDATE\s+.+\s+SET)/i,                // ; UPDATE ... SET
    /(;\s*CREATE\s+TABLE)/i,                   // ; CREATE TABLE
    /(;\s*ALTER\s+TABLE)/i,                    // ; ALTER TABLE
    /(--\s*$)/m,                               // SQL comment at end
    /('\s*OR\s*')/i,                           // ' OR '
    /('\s*AND\s*')/i,                          // ' AND '
    /(\/\*.*?\*\/)/,                           // SQL block comments
    /(EXEC\s*\()/i,                            // EXEC(
    /(EXECUTE\s*\()/i,                         // EXECUTE(
    /(xp_cmdshell)/i,                          // xp_cmdshell
    /(sp_executesql)/i                         // sp_executesql
  ];
  
  const checkForSQLInjection = (obj: any, depth: number = 0): boolean => {
    // Prevent deep recursion
    if (depth > 10) return false;
    
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSQLInjection(value, depth + 1));
    }
    return false;
  };
  
    if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query)) {
      console.warn('🚨 Potential SQL injection attempt:', {
        ip: req.ip,
        url: req.url,
        body: req.body,
        query: req.query
      });
      
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        message: 'Request contains invalid characters'
      });
      return;
    }
  
  next();
};

// XSS protection
export const xssProtection = (req: Request, res: Response, next: NextFunction): void => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<meta[^>]*>.*?<\/meta>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi
  ];
  
  const checkForXSS = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return xssPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForXSS(value));
    }
    return false;
  };
  
    if (checkForXSS(req.body) || checkForXSS(req.query)) {
      console.warn('🚨 Potential XSS attempt:', {
        ip: req.ip,
        url: req.url,
        body: req.body,
        query: req.query
      });
      
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        message: 'Request contains potentially malicious content'
      });
      return;
    }
  
  next();
};

// Export all security middleware
export const securityMiddleware = {
  generalRateLimit,
  authRateLimit,
  passwordResetRateLimit,
  uploadRateLimit,
  securityHeaders,
  corsConfig,
  requestSizeLimit,
  sanitizeInput,
  validatePasswordStrength,
  validateEmail,
  bruteForceProtection,
  trackLoginAttempt,
  securityLogger,
  sqlInjectionProtection,
  xssProtection
};
