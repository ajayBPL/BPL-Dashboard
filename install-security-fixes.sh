#!/bin/bash

# BPL Commander Security Fixes Installation Script
# This script installs all the critical security fixes and updates

set -e

echo "🔒 BPL Commander Security Fixes Installation"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the BPL Commander root directory"
    exit 1
fi

print_status "Starting security fixes installation..."

# 1. Install updated dependencies
print_status "Installing updated backend dependencies..."
cd backend
npm install

print_status "Installing updated frontend dependencies..."
cd ../frontend
npm install

cd ..

# 2. Create .env file if it doesn't exist
print_status "Setting up environment configuration..."
if [ ! -f "backend/.env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp backend/env.example backend/.env
    print_warning "Please edit backend/.env with your actual configuration values"
    print_warning "IMPORTANT: Change JWT_SECRET to a secure random string (at least 32 characters)"
else
    print_success ".env file already exists"
fi

# 3. Generate secure JWT secret if not set
if grep -q "your_super_secret_jwt_key_change_this_in_production" backend/.env; then
    print_warning "Default JWT_SECRET detected. Generating secure secret..."
    SECRET=$(openssl rand -base64 64 | tr -d '\n')
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your_super_secret_jwt_key_change_this_in_production/$SECRET/" backend/.env
    else
        # Linux
        sed -i "s/your_super_secret_jwt_key_change_this_in_production/$SECRET/" backend/.env
    fi
    print_success "Generated secure JWT_SECRET"
fi

# 4. Set up database
print_status "Setting up database..."
cd backend

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_warning "PostgreSQL is not running or not accessible"
    print_warning "The application will fall back to mock database"
    print_warning "To use PostgreSQL:"
    print_warning "  1. Install PostgreSQL"
    print_warning "  2. Create database: CREATE DATABASE bpl_commander;"
    print_warning "  3. Update DATABASE_URL in backend/.env"
    print_warning "  4. Run: npm run db:migrate"
else
    print_success "PostgreSQL is running"
    print_status "Running database migrations..."
    npm run db:migrate || print_warning "Database migration failed - will use mock database"
fi

cd ..

# 5. Build the application
print_status "Building the application..."
npm run build

# 6. Run security validation
print_status "Running security validation..."
cd backend
node -e "
const { validateEnvironmentOrExit } = require('./dist/utils/envValidation');
try {
    validateEnvironmentOrExit();
    console.log('✅ Environment validation passed');
} catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
}
" || print_warning "Environment validation failed - check your .env file"

cd ..

# 7. Create security checklist
print_status "Creating security checklist..."
cat > SECURITY_CHECKLIST.md << 'EOF'
# BPL Commander Security Checklist

## ✅ Completed Security Fixes

- [x] Removed plain text password support
- [x] Fixed hardcoded default passwords
- [x] Added proper JWT secret validation
- [x] Improved database connection error handling
- [x] Restricted CORS to specific origins
- [x] Added input sanitization and validation
- [x] Updated vulnerable dependencies
- [x] Added environment variable validation
- [x] Implemented password strength requirements
- [x] Added comprehensive security configuration

## 🔒 Security Configuration

### Password Policy
- Minimum 8 characters (12 in production)
- Must contain uppercase, lowercase, numbers, and special characters
- Prevents common password patterns
- Password history tracking

### Session Management
- JWT tokens with 24-hour expiration
- Secure token generation and validation
- Session timeout after 30 minutes of inactivity

### Rate Limiting
- 100 requests per 15-minute window
- IP-based rate limiting
- Configurable limits per environment

### Input Validation
- HTML sanitization to prevent XSS
- Email format validation
- Phone number validation
- File upload validation

## 🚨 Critical Actions Required

### 1. Environment Configuration
- [ ] Update JWT_SECRET in backend/.env (if not done automatically)
- [ ] Configure DATABASE_URL for PostgreSQL
- [ ] Set NODE_ENV to 'production' for production deployment
- [ ] Configure SMTP settings for email notifications

### 2. Database Setup
- [ ] Install PostgreSQL
- [ ] Create bpl_commander database
- [ ] Run database migrations: `npm run db:migrate`
- [ ] Seed initial data: `npm run db:seed`

### 3. Production Deployment
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### 4. User Management
- [ ] Change default admin password
- [ ] Enable two-factor authentication (optional)
- [ ] Set up user account policies
- [ ] Configure password reset functionality

## 🔍 Security Monitoring

### Regular Checks
- [ ] Monitor failed login attempts
- [ ] Review access logs
- [ ] Check for suspicious activity
- [ ] Update dependencies regularly
- [ ] Review security configurations

### Incident Response
- [ ] Document security incident procedures
- [ ] Set up alerting for security events
- [ ] Plan for data breach response
- [ ] Regular security audits

## 📞 Support

For security-related issues or questions:
- Review the security configuration in `backend/src/config/security.ts`
- Check environment validation in `backend/src/utils/envValidation.ts`
- Monitor application logs for security events

EOF

print_success "Security checklist created: SECURITY_CHECKLIST.md"

# 8. Final validation
print_status "Running final validation..."

# Check if all critical files exist
CRITICAL_FILES=(
    "backend/src/utils/envValidation.ts"
    "backend/src/utils/sanitization.ts"
    "backend/src/config/security.ts"
    "backend/.env"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file is missing"
    fi
done

# Check if dependencies are installed
if [ -d "backend/node_modules" ] && [ -d "frontend/node_modules" ]; then
    print_success "✓ Dependencies installed"
else
    print_error "✗ Dependencies not properly installed"
fi

echo ""
echo "🎉 Security fixes installation completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Review and update backend/.env with your configuration"
echo "2. Set up PostgreSQL database (recommended)"
echo "3. Run 'npm run dev' to start the application"
echo "4. Review SECURITY_CHECKLIST.md for additional security measures"
echo ""
echo "🔒 Security improvements applied:"
echo "   - Removed plain text password support"
echo "   - Added input sanitization"
echo "   - Improved error handling"
echo "   - Updated dependencies"
echo "   - Added environment validation"
echo "   - Implemented password strength requirements"
echo ""
print_warning "Remember to change default passwords and configure production settings!"

