# 🚀 BPL Commander Application Setup Guide

## Current Status
✅ **Backend Server**: Running on `http://localhost:3001`  
✅ **Frontend Server**: Starting on `http://192.168.10.205:3000`  
✅ **Security Features**: All implemented and working  
✅ **Database Migration**: Completed (Projects & Initiatives working)  

## 🌐 Network Configuration

**Your Current Network IP**: `192.168.10.205`  
**Backend API**: `http://192.168.10.205:3001`  
**Frontend App**: `http://192.168.10.205:3000`  

## 🔐 Password Update Required

The application is running but you need to update the passwords in your Supabase database. Here are the options:

### Option 1: Manual Database Update (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run these SQL commands:

```sql
-- Update passwords for default users
UPDATE users SET password = '$2b$12$SfuKgGVMMLrh/zAgh1A71eNnqU/029oXdvJ5sT6vnLyN29nhcEo.C' WHERE email = 'admin@bplcommander.com';

UPDATE users SET password = '$2b$12$OCgp6ftgXHjrP4YoJa5q4u8UzucRFERe1iXyu7NbbalpKNX5aY04W' WHERE email = 'manager@bplcommander.com';

UPDATE users SET password = '$2b$12$tL7UMqenXiRWwkZDDkRJ4uBL2cY68idnJBSQgxTg1hrm8LxJNV8Ua' WHERE email = 'employee@bplcommander.com';
```

### Option 2: Use Old Passwords Temporarily
If you want to test immediately, you can temporarily use the old passwords:
- Admin: `admin@bplcommander.com` / `Admin123!`
- Manager: `manager@bplcommander.com` / `Admin123!`
- Employee: `employee@bplcommander.com` / `Admin123!`

## 🔑 New Secure Login Credentials

After updating the database, use these secure passwords:

**Admin User:**
- Email: `admin@bplcommander.com`
- Password: `y0vnyk&6cGRCMV4a`

**Manager User:**
- Email: `manager@bplcommander.com`
- Password: `p01m#Y$FC&DIDm&p`

**Employee User:**
- Email: `employee@bplcommander.com`
- Password: `UI#7dPp%#Oz8@^9f`

## 🌐 Access URLs

**Local Access:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

**Network Access (from other devices):**
- Frontend: `http://192.168.10.205:3000`
- Backend API: `http://192.168.10.205:3001`

## 🧪 Testing the Application

1. **Test Backend API:**
   ```bash
   cd "E:\BPL_Commander New Repo\BPL-Dashboard"
   node final-api-test.js
   ```

2. **Test Frontend:**
   - Open browser to `http://192.168.10.205:3000`
   - Try logging in with the credentials above

## 📱 Mobile/Tablet Access

Other devices on your network can access the application at:
- `http://192.168.10.205:3000`

## 🔧 Troubleshooting

### If Backend Won't Start:
```bash
cd "E:\BPL_Commander New Repo\BPL-Dashboard\backend"
npm run dev
```

### If Frontend Won't Start:
```bash
cd "E:\BPL_Commander New Repo\BPL-Dashboard\frontend"
npm run dev -- --host 192.168.10.205 --port 3000
```

### If Login Fails:
1. Check if passwords were updated in Supabase
2. Try the old passwords temporarily
3. Check browser console for errors

## 🛡️ Security Features Active

✅ Rate limiting (5 auth attempts per 15 min)  
✅ Input validation and sanitization  
✅ SQL injection protection  
✅ XSS protection  
✅ Brute force protection  
✅ Security headers (Helmet)  
✅ Strong password requirements  
✅ Secure JWT configuration  

## 📊 Available API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/users` - Get all users
- `GET /api/projects` - Get all projects
- `GET /api/initiatives` - Get all initiatives
- `GET /api/workload` - Get workload data
- `GET /api/activity` - Get activity logs
- `GET /api/health` - Health check

## 🎯 Next Steps

1. **Update passwords** in Supabase database
2. **Test login** with new credentials
3. **Access from other devices** on your network
4. **Explore the application** features

---

**Application Status: READY TO USE** 🎉

The BPL Commander application is now running with enhanced security features and is accessible from your network at `192.168.10.205:3000`.
