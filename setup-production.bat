@echo off
REM BPL Commander Production Setup Script for Windows
REM This script sets up the application for production deployment

echo 🚀 BPL Commander Production Setup
echo ==================================

REM Check if .env file exists
if not exist "backend\.env" (
    echo ❌ .env file not found in backend directory
    echo 📝 Creating .env file from template...
    
    REM Create .env file with production-ready defaults
    (
        echo # Supabase Configuration
        echo SUPABASE_URL="https://mwrdlemotjhrnjzncbxk.supabase.co"
        echo SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cmRsZW1vdGpocm5qem5jYnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDQxNDMsImV4cCI6MjA2OTM4MDE0M30.b-0QzJwCbxlEqb6koGIUiEU6bC0J1zkLN0eMV5E3_Dg"
        echo SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
        echo.
        echo # Database Configuration
        echo DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:your_password_here@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
        echo.
        echo # JWT Configuration
        echo JWT_SECRET="bpl_commander_super_secure_jwt_secret_key_2024_production_ready_64_chars_minimum"
        echo JWT_EXPIRES_IN="24h"
        echo.
        echo # Server Configuration
        echo PORT=3001
        echo NODE_ENV="production"
        echo.
        echo # CORS Configuration
        echo CORS_ORIGIN="http://localhost:3000"
        echo.
        echo # File Upload Configuration
        echo UPLOAD_DIR="./uploads"
        echo MAX_FILE_SIZE=5242880
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # Notification Settings
        echo NOTIFICATION_CHECK_INTERVAL=300000
        echo.
        echo # Email Configuration (SMTP) - Optional
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_SECURE=false
        echo SMTP_USER=your-email@gmail.com
        echo SMTP_PASS=your-app-password
    ) > backend\.env
    
    echo ✅ .env file created
    echo ⚠️  Please update the Supabase credentials in backend\.env
) else (
    echo ✅ .env file already exists
)

REM Install dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npm run db:generate

cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install

cd ..

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update Supabase credentials in backend\.env
echo 2. Run 'npm run dev' in both backend and frontend directories
echo 3. Test the application at http://localhost:3000
echo.
echo 🔧 For production deployment:
echo 1. Set NODE_ENV=production in backend\.env
echo 2. Update CORS_ORIGIN to your production domain
echo 3. Configure SMTP settings for email notifications
echo 4. Use a process manager like PM2 for the backend
echo.

pause
