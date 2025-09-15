# 🔧 Network Access Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: "This site can't be reached" or "Connection refused"

#### **Solution A: Check Windows Firewall (Most Common)**
1. **Open Windows Defender Firewall:**
   - Press `Win + R`, type `wf.msc`, press Enter
   - Click "Inbound Rules" in the left panel
   - Click "New Rule..." in the right panel

2. **Create Rule for Frontend (Port 3000):**
   - Select "Port" → Next
   - Select "TCP" → Specific local ports: `3000` → Next
   - Select "Allow the connection" → Next
   - Check all profiles (Domain, Private, Public) → Next
   - Name: "BPL Frontend" → Finish

3. **Create Rule for Backend (Port 3001):**
   - Repeat steps above but use port `3001`
   - Name: "BPL Backend" → Finish

#### **Solution B: Run as Administrator (Alternative)**
```powershell
# Run PowerShell as Administrator, then:
netsh advfirewall firewall add rule name="BPL Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="BPL Backend" dir=in action=allow protocol=TCP localport=3001
```

### Issue 2: "Access Denied" or "Forbidden"

#### **Solution: Check Antivirus/Windows Defender**
1. **Windows Defender:**
   - Open Windows Security
   - Go to "Firewall & network protection"
   - Click "Allow an app through firewall"
   - Add Node.js and your browser

2. **Third-party Antivirus:**
   - Temporarily disable firewall/antivirus
   - Test access
   - If it works, add exceptions for ports 3000 and 3001

### Issue 3: "Network is unreachable"

#### **Solution: Verify Network Configuration**
1. **Check if both systems are on same network:**
   ```cmd
   # On your system (host):
   ipconfig
   
   # On other system:
   ping 192.168.29.213
   ```

2. **Test port connectivity:**
   ```cmd
   # On other system:
   telnet 192.168.29.213 3000
   telnet 192.168.29.213 3001
   ```

### Issue 4: "CORS Error" in Browser Console

#### **Solution: CORS is already configured, but check:**
1. **Ensure backend is running:**
   ```powershell
   # Check if backend is running:
   netstat -an | findstr :3001
   ```

2. **Test API directly:**
   ```powershell
   Invoke-WebRequest -Uri "http://192.168.29.213:3001/health" -Method GET
   ```

## 🔍 Step-by-Step Verification

### Step 1: Verify Services are Running
```powershell
# Check if both services are listening:
netstat -an | findstr :3000
netstat -an | findstr :3001

# Should show:
# TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING
# TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING
```

### Step 2: Test from Host System
```powershell
# Test frontend:
Invoke-WebRequest -Uri "http://192.168.29.213:3000" -Method GET

# Test backend:
Invoke-WebRequest -Uri "http://192.168.29.213:3001/health" -Method GET
```

### Step 3: Test from Other System
```cmd
# Test connectivity:
ping 192.168.29.213

# Test ports (if telnet is available):
telnet 192.168.29.213 3000
telnet 192.168.29.213 3001

# Test in browser:
http://192.168.29.213:3000
```

## 🛠️ Alternative Solutions

### Solution 1: Use ngrok (Tunnel Service)
If firewall issues persist, use ngrok to create a public tunnel:

1. **Install ngrok:**
   - Download from https://ngrok.com/
   - Extract and add to PATH

2. **Create tunnel:**
   ```cmd
   # For frontend:
   ngrok http 3000
   
   # For backend:
   ngrok http 3001
   ```

3. **Use the ngrok URLs:**
   - Frontend: `https://xxxxx.ngrok.io`
   - Backend: `https://yyyyy.ngrok.io`

### Solution 2: Use Cloudflare Tunnel
```bash
# Install cloudflared
# Create tunnel
cloudflared tunnel --url http://localhost:3000
```

### Solution 3: Deploy to Cloud Service
- **Vercel** (for frontend)
- **Railway/Render** (for full-stack)
- **AWS/Azure** (for production)

## 📱 Mobile Access Issues

### If mobile devices can't access:

1. **Check mobile network:**
   - Ensure mobile is on same WiFi network
   - Check if mobile has data restrictions

2. **Test with mobile browser:**
   - Use Chrome/Safari on mobile
   - Try incognito/private mode

## 🔧 Quick Fix Commands

### Restart Services:
```powershell
# Stop all Node processes:
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Restart services:
npm run dev
```

### Check Network Status:
```powershell
# Check listening ports:
netstat -an | findstr "3000\|3001"

# Check firewall status:
netsh advfirewall show allprofiles state

# Check network adapter:
ipconfig /all
```

## 📞 Emergency Solutions

### If Nothing Works:

1. **Use localhost only:**
   - Access: `http://localhost:3000`
   - Share screen instead of network access

2. **Use team collaboration tools:**
   - Share the application via screen sharing
   - Use remote desktop software

3. **Deploy to cloud:**
   - Quick deployment to Vercel/Netlify
   - Use the cloud URL for team access

## 🎯 Success Indicators

### ✅ Everything is working when:
- `http://192.168.29.213:3000` loads in browser
- `http://192.168.29.213:3001/health` returns JSON
- Team members can access from their systems
- No CORS errors in browser console

### ❌ Still having issues when:
- Connection timeout errors
- "Site can't be reached" messages
- CORS errors in console
- Port connection refused

## 📋 Checklist for Team Members

### Before Accessing:
- [ ] Connected to same WiFi network
- [ ] No VPN blocking local network
- [ ] Browser allows local network access
- [ ] Antivirus not blocking connections

### If Still Not Working:
1. Try different browser
2. Clear browser cache
3. Disable browser extensions
4. Check with IT department about network restrictions

---

**Need Help?** Check the console logs where you ran `npm run dev` for any error messages.
