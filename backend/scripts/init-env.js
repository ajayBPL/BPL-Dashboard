#!/usr/bin/env node

/**
 * Initialize .env File Script
 * 
 * Creates a .env file from env.example if it doesn't exist.
 * 
 * Usage: node scripts/init-env.js
 */

const fs = require('fs');
const path = require('path');

const envExamplePath = path.join(__dirname, '..', 'env.example');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('ℹ️  If you want to recreate it, delete the existing file first.\n');
  process.exit(0);
}

if (!fs.existsSync(envExamplePath)) {
  console.error('❌ env.example file not found!');
  console.error('📝 Expected location:', envExamplePath);
  process.exit(1);
}

try {
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
  fs.writeFileSync(envPath, envExampleContent, 'utf-8');
  
  console.log('✅ Created .env file from env.example');
  console.log('\n⚠️  IMPORTANT: Update the .env file with your actual configuration values!');
  console.log('📝 See backend/env.example for detailed instructions.');
  console.log('🔐 Generate JWT secret: npm run env:generate-jwt');
  console.log('✅ Validate configuration: npm run env:validate\n');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

