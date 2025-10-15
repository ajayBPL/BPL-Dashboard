# BPL Commander - Production Setup Guide

## 🚀 Supabase Configuration Status

The BPL Commander application has been configured to use **Supabase PostgreSQL** as the primary database with comprehensive fallback mechanisms.

## 📋 Current Configuration

### ✅ What's Working
- **Supabase Client**: Properly configured with environment variables
- **Database Schema**: Complete Prisma schema with all required tables
- **API Endpoints**: All endpoints are functional with proper error handling
- **Authentication**: JWT-based authentication with Supabase integration
- **Fallback Systems**: File-based and in-memory databases for development

### ⚠️ What Needs Configuration

1. **Supabase Credentials**: Update the following in `backend/.env`:
   ```bash
   SUPABASE_URL="https://mwrdlemotjhrnjzncbxk.supabase.co"
   SUPABASE_ANON_KEY="your_actual_anon_key"
   SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key"
   DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   ```

2. **Database Schema**: Ensure your Supabase database has the correct schema by running:
   ```bash
   cd backend
   npm run db:migrate
   ```

## 🔧 Production Setup Steps

### Step 1: Environment Configuration

1. **Copy the environment template**:
   ```bash
   cp backend/env.example backend/.env
   ```

2. **Update Supabase credentials** in `backend/.env`:
   - Get your Supabase project URL and keys from the Supabase dashboard
   - Update `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
   - Update `DATABASE_URL` with your actual database connection string

3. **Set production values**:
   ```bash
   NODE_ENV="production"
   JWT_SECRET="your_super_secure_jwt_secret_64_chars_minimum"
   CORS_ORIGIN="https://your-production-domain.com"
   ```

### Step 2: Database Setup

1. **Run database migrations**:
   ```bash
   cd backend
   npm run db:migrate
   ```

2. **Seed the database** (optional):
   ```bash
   npm run db:seed
   ```

### Step 3: Install Dependencies

1. **Backend dependencies**:
   ```bash
   cd backend
   npm install
   npm run build
   ```

2. **Frontend dependencies**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

### Step 4: Test the Setup

1. **Run the API test script**:
   ```bash
   # Linux/Mac
   chmod +x test-api-endpoints.sh
   ./test-api-endpoints.sh
   
   # Windows
   .\test-api-endpoints.ps1
   ```

2. **Start the application**:
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend (in another terminal)
   cd frontend
   npm start
   ```

## 🧪 Testing All Endpoints

The application includes comprehensive API testing scripts that verify all endpoints:

### Available Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/auth/login` | POST | User authentication | ✅ |
| `/api/auth/register` | POST | User registration | ✅ |
| `/api/users` | GET | Get all users | ✅ |
| `/api/users/:id` | GET | Get user by ID | ✅ |
| `/api/projects` | GET/POST | Project management | ✅ |
| `/api/initiatives` | GET/POST | Initiative management | ✅ |
| `/api/comments` | GET/POST | Comment system | ✅ |
| `/api/analytics` | GET | Analytics data | ✅ |
| `/api/workload` | GET | Workload tracking | ✅ |
| `/api/search` | GET | Global search | ✅ |
| `/api/activity` | GET | Activity logs | ✅ |
| `/api/notifications` | GET | Notifications | ✅ |
| `/api/settings` | GET | Application settings | ✅ |
| `/api/departments` | GET | Department management | ✅ |
| `/api/roles` | GET | Role management | ✅ |
| `/api/export` | GET | Data export | ✅ |
| `/api/sync/data` | GET | Data synchronization | ✅ |

## 🔒 Security Configuration

### Production Security Checklist

- [ ] **JWT Secret**: Use a strong, unique JWT secret (64+ characters)
- [ ] **CORS**: Configure CORS to only allow your production domain
- [ ] **Rate Limiting**: Configure appropriate rate limits
- [ ] **HTTPS**: Ensure all communication uses HTTPS
- [ ] **Environment Variables**: Never commit `.env` files to version control
- [ ] **Database Access**: Use connection pooling and proper access controls

### Environment Variables for Production

```bash
# Required
NODE_ENV="production"
JWT_SECRET="your_super_secure_jwt_secret_64_chars_minimum"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
DATABASE_URL="postgresql://user:password@host:port/database"

# Optional but recommended
CORS_ORIGIN="https://your-production-domain.com"
SMTP_HOST="your-smtp-server.com"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-app-password"
```

## 🚀 Deployment Options

### Option 1: Traditional Server Deployment

1. **Use PM2 for process management**:
   ```bash
   npm install -g pm2
   pm2 start backend/dist/index.js --name "bpl-backend"
   pm2 startup
   pm2 save
   ```

2. **Use Nginx as reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

### Option 2: Docker Deployment

1. **Create Dockerfile for backend**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   services:
     backend:
       build: ./backend
       ports:
         - "3001:3001"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
         - SUPABASE_URL=${SUPABASE_URL}
         - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
     
     frontend:
       build: ./frontend
       ports:
         - "3000:3000"
       depends_on:
         - backend
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Check Supabase credentials in `.env`
   - Verify database URL format
   - Ensure Supabase project is active

2. **Authentication Issues**:
   - Verify JWT secret is set
   - Check Supabase auth configuration
   - Ensure user exists in database

3. **CORS Errors**:
   - Update `CORS_ORIGIN` in `.env`
   - Check frontend API configuration

4. **API Endpoints Not Working**:
   - Run the test script to identify specific failures
   - Check server logs for error details
   - Verify database schema is correct

### Debug Commands

```bash
# Check environment variables
cd backend && node -e "console.log(process.env)"

# Test database connection
cd backend && npm run test:db

# Check API health
curl http://localhost:3001/health

# View server logs
pm2 logs bpl-backend
```

## 📞 Support

If you encounter issues:

1. **Check the logs**: Server logs will show detailed error information
2. **Run the test script**: Use the provided test scripts to identify specific problems
3. **Verify configuration**: Ensure all environment variables are set correctly
4. **Check Supabase dashboard**: Verify your Supabase project is configured properly

## 🎉 Success Indicators

Your setup is working correctly when:

- ✅ Server starts without errors
- ✅ Database connection is successful
- ✅ All API endpoints return proper responses
- ✅ Frontend can connect to backend
- ✅ Authentication works with test users
- ✅ All CRUD operations function properly

---

**Note**: This application is production-ready with Supabase PostgreSQL as the primary database. The comprehensive fallback systems ensure it works even if Supabase is temporarily unavailable.
