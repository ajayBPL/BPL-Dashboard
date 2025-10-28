/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize and validate user inputs
 * to prevent XSS attacks, SQL injection, and other security issues.
 */

import validator from 'validator';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Simple implementation that strips all HTML tags except allowed ones
 * @param input - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // For now, just escape all HTML to prevent XSS
  // This is safer than trying to parse and allow specific tags
  return validator.escape(input);
}

/**
 * Sanitizes plain text by removing HTML tags and special characters
 * @param input - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return validator.escape(input.trim());
}

/**
 * Validates and sanitizes email addresses
 * @param email - Email to validate
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }
  
  const normalized = validator.normalizeEmail(email);
  return normalized && validator.isEmail(normalized) ? normalized : null;
}

/**
 * Validates and sanitizes phone numbers
 * @param phone - Phone number to validate
 * @returns Sanitized phone number or null if invalid
 */
export function sanitizePhone(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }
  
  const cleaned = phone.replace(/[^\d+]/g, '');
  return validator.isMobilePhone(cleaned) ? cleaned : null;
}

/**
 * Validates and sanitizes URLs
 * @param url - URL to validate
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }
  
  return validator.isURL(url) ? validator.escape(url) : null;
}

/**
 * Validates and sanitizes numeric input
 * @param input - Numeric string to validate
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumber(input: string, min?: number, max?: number): number | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  const num = parseFloat(input);
  if (isNaN(num)) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return null;
  }
  
  if (max !== undefined && num > max) {
    return null;
  }
  
  return num;
}

/**
 * Validates and sanitizes integer input
 * @param input - Integer string to validate
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns Sanitized integer or null if invalid
 */
export function sanitizeInteger(input: string, min?: number, max?: number): number | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  const num = parseInt(input, 10);
  if (isNaN(num)) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return null;
  }
  
  if (max !== undefined && num > max) {
    return null;
  }
  
  return num;
}

/**
 * Validates and sanitizes password strength
 * @param password - Password to validate
 * @returns Object with validation result and suggestions
 */
export function validatePassword(password: string): {
  isValid: boolean;
  score: number;
  suggestions: string[];
} {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      suggestions: ['Password must be a string']
    };
  }
  
  const suggestions: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push('Password should be at least 8 characters long');
  }
  
  if (password.length >= 12) {
    score += 1;
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Password should contain at least one lowercase letter');
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Password should contain at least one uppercase letter');
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Password should contain at least one number');
  }
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Password should contain at least one special character');
  }
  
  // Common patterns check
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    suggestions.push('Avoid common password patterns');
  } else {
    score += 1;
  }
  
  return {
    isValid: score >= 4 && password.length >= 8,
    score,
    suggestions
  };
}

/**
 * Sanitizes object properties recursively
 * @param obj - Object to sanitize
 * @param rules - Sanitization rules for each property
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  rules: Record<keyof T, (value: any) => any>
): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    const rule = rules[key as keyof T];
    if (rule) {
      sanitized[key as keyof T] = rule(value);
    } else {
      // Default sanitization for unknown properties
      sanitized[key as keyof T] = typeof value === 'string' ? sanitizeText(value) : value;
    }
  }
  
  return sanitized;
}

/**
 * Validates file upload
 * @param file - File object to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export function validateFileUpload(
  file: Express.Multer.File,
  allowedTypes: string[],
  maxSize: number
): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, error: `File type ${file.mimetype} not allowed` };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: `File size ${file.size} exceeds maximum ${maxSize}` };
  }
  
  // Check for malicious file names
  const maliciousPatterns = [
    /\.\./,
    /[<>:"|?*]/,
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
  ];
  
  if (maliciousPatterns.some(pattern => pattern.test(file.originalname))) {
    return { isValid: false, error: 'Invalid file name' };
  }
  
  return { isValid: true };
}

