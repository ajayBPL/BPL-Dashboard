#!/usr/bin/env node

/**
 * Environment Configuration Validation Script
 * 
 * Validates that all required environment variables are properly configured.
 * Run this before deploying to production.
 * 
 * Usage: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PLACEHOLDER_VALUES = [
  'your-project-id',
  'your_supabase_anon_key_here',
  'your_supabase_service_role_key_here',
  'your_password',
  'your_super_secret_jwt_key_change_this_in_production',
  'your-email@gmail.com',
  'your-app-password',
  'your-email',
  'your_password',
  'localhost:3000'
];

function checkPlaceholders() {
  const issues = [];
  const envFile = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envFile)) {
    console.error('❌ .env file not found!');
    console.error('📝 Copy backend/env.example to backend/.env and configure it.');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envFile, 'utf-8');
  
  for (const placeholder of PLACEHOLDER_VALUES) {
    if (envContent.includes(placeholder)) {
      issues.push(`Found placeholder value: "${placeholder}"`);
    }
  }
  
  return issues;
}

function validateRequiredVars() {
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
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
  
  const missing = [];
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  return missing;
}

function validateFormat() {
  const errors = [];
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters (64+ recommended for production)');
    }
  }
  
  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  // Validate SUPABASE_URL format
  if (process.env.SUPABASE_URL) {
    try {
      const url = new URL(process.env.SUPABASE_URL);
      if (!url.hostname.includes('supabase.co')) {
        errors.push('SUPABASE_URL should be a Supabase project URL');
      }
    } catch (e) {
      errors.push('SUPABASE_URL must be a valid URL');
    }
  }
  
  // Validate SUPABASE_ANON_KEY format
  if (process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY.length < 50) {
    errors.push('SUPABASE_ANON_KEY appears to be invalid (too short)');
  }
  
  // Validate CORS_ORIGIN format
  if (process.env.CORS_ORIGIN) {
    try {
      new URL(process.env.CORS_ORIGIN);
    } catch (e) {
      errors.push('CORS_ORIGIN must be a valid URL');
    }
  }
  
  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      errors.push('JWT_SECRET must be at least 64 characters in production');
    }
    
    if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes('localhost')) {
      errors.push('CORS_ORIGIN should not use localhost in production');
    }
  }
  
  return errors;
}

// Main validation
console.log('🔍 Validating environment configuration...\n');

const placeholderIssues = checkPlaceholders();
const missingVars = validateRequiredVars();
const formatErrors = validateFormat();

let hasErrors = false;

if (placeholderIssues.length > 0) {
  console.error('⚠️  Placeholder values found (must be replaced):');
  placeholderIssues.forEach(issue => console.error(`  - ${issue}`));
  hasErrors = true;
}

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(variable => console.error(`  - ${variable}`));
  hasErrors = true;
}

if (formatErrors.length > 0) {
  console.error('\n❌ Format validation errors:');
  formatErrors.forEach(error => console.error(`  - ${error}`));
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n📖 Please check your .env file and fix the above issues.');
  console.error('📖 See backend/env.example for reference.');
  process.exit(1);
}

console.log('✅ All environment variables are properly configured!\n');

// Show summary
console.log('📋 Configuration Summary:');
console.log(`   Environment: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   Port: ${process.env.PORT || 'not set'}`);
console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   Database URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   JWT Secret: ${process.env.JWT_SECRET ? `✅ Set (${process.env.JWT_SECRET.length} chars)` : '❌ Missing'}`);
console.log(`   CORS Origin: ${process.env.CORS_ORIGIN || 'not set'}`);
console.log(`   SMTP Config: ${process.env.SMTP_HOST && process.env.SMTP_USER ? '✅ Configured' : '⚠️  Not configured'}`);

process.exit(0);

