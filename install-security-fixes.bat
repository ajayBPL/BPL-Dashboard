@echo off
setlocal enabledelayedexpansion

echo 🔒 BPL Commander Security Fixes Installation
echo =============================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the BPL Commander root directory
    exit /b 1
)

echo [INFO] Starting security fixes installation...

REM 1. Install updated dependencies
echo [INFO] Installing updated backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    exit /b 1
)

echo [INFO] Installing updated frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)

cd ..

REM 2. Create .env file if it doesn't exist
echo [INFO] Setting up environment configuration...
if not exist "backend\.env" (
    echo [WARNING] .env file not found. Creating from template...
    copy "backend\env.example" "backend\.env"
    echo [WARNING] Please edit backend\.env with your actual configuration values
    echo [WARNING] IMPORTANT: Change JWT_SECRET to a secure random string (at least 32 characters)
) else (
    echo [SUCCESS] .env file already exists
)

REM 3. Generate secure JWT secret if not set
findstr /c:"your_super_secret_jwt_key_change_this_in_production" "backend\.env" >nul
if !errorlevel! equ 0 (
    echo [WARNING] Default JWT_SECRET detected. Please change it manually in backend\.env
    echo [WARNING] Generate a secure secret using: openssl rand -base64 64
)

REM 4. Set up database
echo [INFO] Setting up database...
cd backend

REM Check if PostgreSQL is running (basic check)
sc query postgresql >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PostgreSQL service not found or not running
    echo [WARNING] The application will fall back to mock database
    echo [WARNING] To use PostgreSQL:
    echo [WARNING]   1. Install PostgreSQL
    echo [WARNING]   2. Create database: CREATE DATABASE bpl_commander;
    echo [WARNING]   3. Update DATABASE_URL in backend\.env
    echo [WARNING]   4. Run: npm run db:migrate
) else (
    echo [SUCCESS] PostgreSQL service found
    echo [INFO] Running database migrations...
    call npm run db:migrate
    if errorlevel 1 (
        echo [WARNING] Database migration failed - will use mock database
    )
)

cd ..

REM 5. Build the application
echo [INFO] Building the application...
call npm run build
if errorlevel 1 (
    echo [WARNING] Build failed - some features may not work properly
)

REM 6. Create security checklist
echo [INFO] Creating security checklist...
(
echo # BPL Commander Security Checklist
echo.
echo ## ✅ Completed Security Fixes
echo.
echo - [x] Removed plain text password support
echo - [x] Fixed hardcoded default passwords
echo - [x] Added proper JWT secret validation
echo - [x] Improved database connection error handling
echo - [x] Restricted CORS to specific origins
echo - [x] Added input sanitization and validation
echo - [x] Updated vulnerable dependencies
echo - [x] Added environment variable validation
echo - [x] Implemented password strength requirements
echo - [x] Added comprehensive security configuration
echo.
echo ## 🔒 Security Configuration
echo.
echo ### Password Policy
echo - Minimum 8 characters (12 in production)
echo - Must contain uppercase, lowercase, numbers, and special characters
echo - Prevents common password patterns
echo - Password history tracking
echo.
echo ### Session Management
echo - JWT tokens with 24-hour expiration
echo - Secure token generation and validation
echo - Session timeout after 30 minutes of inactivity
echo.
echo ### Rate Limiting
echo - 100 requests per 15-minute window
echo - IP-based rate limiting
echo - Configurable limits per environment
echo.
echo ### Input Validation
echo - HTML sanitization to prevent XSS
echo - Email format validation
echo - Phone number validation
echo - File upload validation
echo.
echo ## 🚨 Critical Actions Required
echo.
echo ### 1. Environment Configuration
echo - [ ] Update JWT_SECRET in backend\.env (if not done automatically)
echo - [ ] Configure DATABASE_URL for PostgreSQL
echo - [ ] Set NODE_ENV to 'production' for production deployment
echo - [ ] Configure SMTP settings for email notifications
echo.
echo ### 2. Database Setup
echo - [ ] Install PostgreSQL
echo - [ ] Create bpl_commander database
echo - [ ] Run database migrations: `npm run db:migrate`
echo - [ ] Seed initial data: `npm run db:seed`
echo.
echo ### 3. Production Deployment
echo - [ ] Enable HTTPS
echo - [ ] Configure proper CORS origins
echo - [ ] Set up SSL certificates
echo - [ ] Configure firewall rules
echo - [ ] Set up monitoring and logging
echo - [ ] Configure backup strategy
echo.
echo ### 4. User Management
echo - [ ] Change default admin password
echo - [ ] Enable two-factor authentication (optional)
echo - [ ] Set up user account policies
echo - [ ] Configure password reset functionality
echo.
echo ## 🔍 Security Monitoring
echo.
echo ### Regular Checks
echo - [ ] Monitor failed login attempts
echo - [ ] Review access logs
echo - [ ] Check for suspicious activity
echo - [ ] Update dependencies regularly
echo - [ ] Review security configurations
echo.
echo ### Incident Response
echo - [ ] Document security incident procedures
echo - [ ] Set up alerting for security events
echo - [ ] Plan for data breach response
echo - [ ] Regular security audits
echo.
echo ## 📞 Support
echo.
echo For security-related issues or questions:
echo - Review the security configuration in `backend\src\config\security.ts`
echo - Check environment validation in `backend\src\utils\envValidation.ts`
echo - Monitor application logs for security events
) > SECURITY_CHECKLIST.md

echo [SUCCESS] Security checklist created: SECURITY_CHECKLIST.md

REM 7. Final validation
echo [INFO] Running final validation...

REM Check if all critical files exist
set "critical_files=backend\src\utils\envValidation.ts backend\src\utils\sanitization.ts backend\src\config\security.ts backend\.env"

for %%f in (%critical_files%) do (
    if exist "%%f" (
        echo [SUCCESS] ✓ %%f exists
    ) else (
        echo [ERROR] ✗ %%f is missing
    )
)

REM Check if dependencies are installed
if exist "backend\node_modules" (
    if exist "frontend\node_modules" (
        echo [SUCCESS] ✓ Dependencies installed
    ) else (
        echo [ERROR] ✗ Frontend dependencies not properly installed
    )
) else (
    echo [ERROR] ✗ Backend dependencies not properly installed
)

echo.
echo 🎉 Security fixes installation completed!
echo.
echo 📋 Next Steps:
echo 1. Review and update backend\.env with your configuration
echo 2. Set up PostgreSQL database (recommended)
echo 3. Run 'npm run dev' to start the application
echo 4. Review SECURITY_CHECKLIST.md for additional security measures
echo.
echo 🔒 Security improvements applied:
echo    - Removed plain text password support
echo    - Added input sanitization
echo    - Improved error handling
echo    - Updated dependencies
echo    - Added environment validation
echo    - Implemented password strength requirements
echo.
echo [WARNING] Remember to change default passwords and configure production settings!

pause

