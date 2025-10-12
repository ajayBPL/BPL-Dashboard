# 🌐 BPL Commander - Network Configuration Guide

## ✅ **Network Configuration Complete**

Your BPL Commander application is now configured for network access on **192.168.10.205**.

---

## 🔧 **Configuration Details**

### **Backend Server (Port 3001)**
- **Local Access:** `http://localhost:3001`
- **Network Access:** `http://192.168.10.205:3001`
- **Health Check:** `http://192.168.10.205:3001/health`

### **Frontend Server (Port 3000)**
- **Local Access:** `http://localhost:3000`
- **Network Access:** `http://192.168.10.205:3000`

### **CORS Configuration**
The backend is configured to accept requests from:
- `http://192.168.10.205:3000` ✅
- `http://192.168.10.205:3002` ✅
- `http://192.168.10.205:3003` ✅
- `http://192.168.10.205:5173` ✅ (Vite dev server)
- `http://localhost:3000` ✅ (local development)

---

## 🚀 **How to Start the Application**

### **Option 1: Start Both Services (Recommended)**
```bash
npm run dev
```
This will start both frontend and backend simultaneously.

### **Option 2: Start Services Separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

---

## 🌍 **Access URLs**

### **For Local Development:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`

### **For Network Access:**
- Frontend: `http://192.168.10.205:3000`
- Backend API: `http://192.168.10.205:3001/api`

### **For Other Devices on Network:**
Other devices on your network can access:
- Frontend: `http://192.168.10.205:3000`
- Backend API: `http://192.168.10.205:3001/api`

---

## 🔍 **Testing Network Access**

### **1. Test Backend Health**
```bash
curl http://192.168.10.205:3001/health
```

### **2. Test Frontend**
Open browser and navigate to:
```
http://192.168.10.205:3000
```

### **3. Test API Connection**
```bash
curl http://192.168.10.205:3001/api/users
```

---

## 🛠️ **Troubleshooting**

### **If Backend Won't Start:**
1. Check if port 3001 is available:
   ```bash
   netstat -an | findstr :3001
   ```

2. Kill any processes using port 3001:
   ```bash
   taskkill /f /im node.exe
   ```

### **If Frontend Can't Connect to Backend:**
1. Verify backend is running on network IP:
   ```bash
   curl http://192.168.10.205:3001/health
   ```

2. Check Windows Firewall settings
3. Ensure both services are running

### **If CORS Errors Occur:**
The backend is already configured for your network IP. If you see CORS errors:
1. Check the browser console for the exact origin being blocked
2. Verify the frontend is accessing `http://192.168.10.205:3000`

---

## 📱 **Mobile/Tablet Access**

You can access the application from mobile devices or tablets on the same network:
- **URL:** `http://192.168.10.205:3000`
- **Requirements:** Same WiFi network as your development machine

---

## 🔐 **Security Notes**

- The application is configured for development/testing purposes
- For production deployment, update CORS origins and use HTTPS
- Database credentials should be changed from defaults
- JWT secret should be regenerated for production

---

## ✅ **Verification Checklist**

- [ ] Backend starts without errors on port 3001
- [ ] Frontend starts without errors on port 3000
- [ ] Can access `http://192.168.10.205:3000` from browser
- [ ] Can access `http://192.168.10.205:3001/health` from browser
- [ ] Login functionality works from network IP
- [ ] All API endpoints respond correctly

---

## 🎯 **Next Steps**

1. **Start the application:** `npm run dev`
2. **Access from browser:** `http://192.168.10.205:3000`
3. **Test login with existing credentials**
4. **Verify all features work correctly**

Your BPL Commander application is now ready for network access! 🚀
