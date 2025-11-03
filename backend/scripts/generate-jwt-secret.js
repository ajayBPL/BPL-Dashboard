#!/usr/bin/env node

/**
 * Generate JWT Secret Script
 * 
 * Generates a cryptographically secure random string for JWT_SECRET.
 * 
 * Usage: node scripts/generate-jwt-secret.js [length]
 * Default length: 64 characters (recommended for production)
 */

const crypto = require('crypto');

const length = parseInt(process.argv[2]) || 64;

if (length < 32) {
  console.error('⚠️  Warning: JWT secrets should be at least 32 characters (64+ recommended for production)');
}

// Generate random bytes and convert to base64
const secret = crypto.randomBytes(length).toString('base64');

console.log('\n🔐 Generated JWT Secret:');
console.log('─'.repeat(80));
console.log(secret);
console.log('─'.repeat(80));
console.log(`\n📏 Length: ${secret.length} characters`);
console.log('\n📝 Add this to your .env file:');
console.log(`JWT_SECRET="${secret}"`);
console.log('\n⚠️  IMPORTANT: Keep this secret secure and never commit it to version control!\n');

