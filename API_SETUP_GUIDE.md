# BPL Commander API Setup Guide

## Current Status
✅ Backend API server is running on port 3001  
✅ Supabase configuration is properly set up  
❌ Database schema needs to be created in Supabase  
❌ Frontend needs to be updated to use correct API endpoints  

## Step 1: Create Database Schema in Supabase

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/mwrdlemotjhrnjzncbxk
2. Navigate to the SQL Editor
3. Copy and paste the contents of `backend/supabase-setup.sql` into the SQL Editor
4. Run the SQL script to create all tables and insert default data

## Step 2: Test API Endpoints

After creating the database schema, test these endpoints:

### Health Check
```bash
curl http://localhost:3001/health
```

### Login Test
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bplcommander.com","password":"Admin123!"}'
```

### Get Users (requires authentication)
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 3: Default Login Credentials

After running the SQL script, you can use these credentials:

- **Admin**: admin@bplcommander.com / Admin123!
- **Manager**: manager@bplcommander.com / Admin123!
- **Employee**: employee@bplcommander.com / Admin123!

## Step 4: Frontend Configuration

The frontend has been updated to use the correct API endpoints:
- API Base URL: http://localhost:3001/api
- Health Check: http://localhost:3001/health

## Step 5: Start Frontend

```bash
cd frontend
npm run dev
```

The frontend should now connect to the backend API running on port 3001.

## Troubleshooting

### Database Connection Issues
- Verify your Supabase credentials in `backend/.env`
- Ensure the database schema has been created
- Check Supabase project status

### API Connection Issues
- Verify backend is running on port 3001
- Check CORS configuration in backend
- Ensure frontend is pointing to correct API URL

### Authentication Issues
- Verify users exist in database
- Check password hashing is working
- Ensure JWT secret is configured

## API Endpoints Available

- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/logout` - User logout
- `/api/users` - User management
- `/api/projects` - Project management
- `/api/initiatives` - Initiative management
- `/api/workload` - Workload tracking
- `/api/analytics` - Analytics data
- `/api/notifications` - Notifications
- `/api/comments` - Comments
- `/api/files` - File management
- `/api/export` - Data export
- `/api/settings` - Settings
- `/api/search` - Search functionality
- `/api/activity` - Activity logs
- `/api/roles` - Role management
- `/api/departments` - Department management
