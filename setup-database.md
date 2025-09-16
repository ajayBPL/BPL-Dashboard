# Database Setup Guide

## Current Issue
The application is using a mock database (in-memory storage) which means:
- Data created on one system is not visible on another system
- Data is lost when the server restarts
- Each backend instance has its own isolated data

## Solution: Set up PostgreSQL Database

### Step 1: Install PostgreSQL
1. Download and install PostgreSQL from https://www.postgresql.org/download/
2. During installation, remember the password you set for the `postgres` user
3. Make sure PostgreSQL service is running

### Step 2: Create Database and User
Open PostgreSQL command line or pgAdmin and run:

```sql
-- Create database
CREATE DATABASE bpl_commander;

-- Create user
CREATE USER bpl_admin WITH PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bpl_commander TO bpl_admin;
```

### Step 3: Create .env file
Create a file named `.env` in the `backend/` directory with:

```env
# Database
DATABASE_URL="postgresql://bpl_admin:secure_password_here@localhost:5432/bpl_commander"

# JWT Configuration
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=3001
NODE_ENV="development"

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

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 4: Run Database Migrations
```bash
cd backend
npm run db:migrate
npm run db:seed
```

### Step 5: Restart the Application
```bash
npm run dev
```

## Alternative: Shared Mock Database (Quick Fix)

If you can't set up PostgreSQL immediately, I can modify the mock database to use a shared file-based storage that persists across systems and restarts.

## Benefits of PostgreSQL Setup
- ✅ Data persists across system restarts
- ✅ Data is shared between different systems
- ✅ Full database functionality (relationships, constraints, etc.)
- ✅ Better performance for large datasets
- ✅ Data backup and recovery options
- ✅ Production-ready solution

Would you like me to help you set up PostgreSQL or implement the shared file-based mock database as a temporary solution?

