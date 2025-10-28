#!/bin/bash

# BPL Commander Production Setup Script
# This script sets up the application for production deployment

echo "🚀 BPL Commander Production Setup"
echo "=================================="

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ .env file not found in backend directory"
    echo "📝 Creating .env file from template..."
    
    # Create .env file with production-ready defaults
    cat > backend/.env << EOF
# Supabase Configuration
SUPABASE_URL="https://mwrdlemotjhrnjzncbxk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cmRsZW1vdGpocm5qem5jYnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDQxNDMsImV4cCI6MjA2OTM4MDE0M30.b-0QzJwCbxlEqb6koGIUiEU6bC0J1zkLN0eMV5E3_Dg"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Database Configuration
DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:your_password_here@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# JWT Configuration
JWT_SECRET="bpl_commander_super_secure_jwt_secret_key_2024_production_ready_64_chars_minimum"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=3001
NODE_ENV="production"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Notification Settings
NOTIFICATION_CHECK_INTERVAL=300000

# Email Configuration (SMTP) - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF
    
    echo "✅ .env file created"
    echo "⚠️  Please update the Supabase credentials in backend/.env"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Check if we can connect to Supabase
echo "🔍 Testing Supabase connection..."
if npm run test:db 2>/dev/null; then
    echo "✅ Supabase connection successful"
else
    echo "⚠️  Supabase connection failed - please check your credentials"
    echo "📝 Make sure to update SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL in backend/.env"
fi

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update Supabase credentials in backend/.env"
echo "2. Run 'npm run dev' in both backend and frontend directories"
echo "3. Test the application at http://localhost:3000"
echo ""
echo "🔧 For production deployment:"
echo "1. Set NODE_ENV=production in backend/.env"
echo "2. Update CORS_ORIGIN to your production domain"
echo "3. Configure SMTP settings for email notifications"
echo "4. Use a process manager like PM2 for the backend"
echo ""
