# BPL Commander - Network Access Guide

## 🚀 Application Status
✅ **Frontend**: Running on `http://192.168.29.213:3000/`  
✅ **Backend API**: Running on `http://192.168.29.213:3001/`  
✅ **Database**: PostgreSQL connected  
✅ **Network Access**: Configured for external access  

## 🌐 Access URLs

### For Team Members (Same Network)
- **Main Application**: http://192.168.29.213:3000/
- **API Health Check**: http://192.168.29.213:3001/health
- **API Base URL**: http://192.168.29.213:3001/api/

### For Local Development
- **Frontend**: http://localhost:3000/
- **Backend**: http://localhost:3001/

## 📋 Prerequisites for Other Systems

### 1. Network Requirements
- Must be on the same local network (192.168.29.x)
- Firewall should allow connections on ports 3000 and 3001
- Windows Defender or antivirus should not block the ports

### 2. Browser Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- No special plugins required

## 🔧 Setup Instructions for Other Systems

### Step 1: Verify Network Connectivity
```bash
# Test if the server is reachable
ping 192.168.29.213

# Test if ports are open (Windows)
telnet 192.168.29.213 3000
telnet 192.168.29.213 3001
```

### Step 2: Access the Application
1. Open web browser
2. Navigate to: `http://192.168.29.213:3000/`
3. The application should load automatically

### Step 3: Test API Access
```bash
# Test API health
curl http://192.168.29.213:3001/health

# Test with PowerShell
Invoke-WebRequest -Uri "http://192.168.29.213:3001/health" -Method GET
```

## 🔐 Authentication

### Default Login Credentials
The application comes with pre-seeded data. You can use any of these accounts:

**Admin Account:**
- Email: `admin@bpl.com`
- Password: `admin123`

**Manager Account:**
- Email: `manager@bpl.com`
- Password: `manager123`

**Employee Account:**
- Email: `employee@bpl.com`
- Password: `employee123`

## 📊 API Endpoints for Data Feeding

### Authentication
```bash
# Login
POST http://192.168.29.213:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@bpl.com",
  "password": "admin123"
}
```

### Available Endpoints

#### Users Management
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Projects Management
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Mock Data (For Testing)
- `GET /api/mock-users` - Get mock users (requires auth token)
- `GET /api/mock-projects` - Get mock projects (requires auth token)

### Example API Usage

#### 1. Login and Get Token
```bash
curl -X POST http://192.168.29.213:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bpl.com","password":"admin123"}'
```

#### 2. Create a New Project
```bash
curl -X POST http://192.168.29.213:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "New Project",
    "description": "Project description",
    "priority": "high",
    "estimated_hours": 100
  }'
```

#### 3. Get All Users
```bash
curl -X GET http://192.168.29.213:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Cannot Access from Other Systems
**Solution:**
- Check Windows Firewall settings
- Ensure both applications are running
- Verify network connectivity

#### 2. CORS Errors
**Solution:**
- The backend is already configured for CORS
- If issues persist, check browser console for specific errors

#### 3. API Authentication Issues
**Solution:**
- Ensure you're using the correct email/password
- Check if the token is being sent in the Authorization header
- Verify the token hasn't expired

### Windows Firewall Configuration
```powershell
# Allow inbound connections on port 3000
netsh advfirewall firewall add rule name="BPL Frontend" dir=in action=allow protocol=TCP localport=3000

# Allow inbound connections on port 3001
netsh advfirewall firewall add rule name="BPL Backend" dir=in action=allow protocol=TCP localport=3001
```

## 📱 Mobile Access

The application is responsive and can be accessed from mobile devices on the same network:
- **Mobile URL**: http://192.168.29.213:3000/
- **Requirements**: Same network, modern mobile browser

## 🔄 Development vs Production

### Current Setup (Development)
- Hot reload enabled
- Detailed error messages
- Mock data available
- Network access configured

### For Production Deployment
1. Build the frontend: `npm run build:frontend`
2. Configure environment variables
3. Set up proper domain and SSL
4. Configure production database
5. Set up reverse proxy (nginx/Apache)

## 📞 Support

If you encounter any issues:
1. Check the console logs in the terminal where you ran `npm run dev`
2. Check browser developer tools for errors
3. Verify network connectivity
4. Ensure all services are running

## 🎯 Next Steps

1. **Test with team members** - Have them access the application
2. **Feed real data** - Use the API endpoints to add your actual data
3. **Customize** - Modify the application according to your needs
4. **Deploy to production** - When ready, deploy to a production server

---

**Note**: This setup is for development/testing purposes. For production deployment, additional security measures and configurations will be required.
