# 🌐 Network Access Troubleshooting Guide

## Current Status ✅
- **Frontend**: http://192.168.10.205:3000 (Running)
- **Backend**: http://192.168.10.205:3001 (Running)
- **API Configuration**: Updated to use network IP

## 🔧 Troubleshooting Steps

### Step 1: Clear Browser Cache
On the other system:
1. **Hard Refresh**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Incognito Mode**: Open in private/incognito window
3. **Clear Cache**: Go to browser settings → Clear browsing data → Cached images and files

### Step 2: Test Direct URLs
Try these URLs from the other system:

1. **Frontend**: http://192.168.10.205:3000
2. **Backend Health**: http://192.168.10.205:3001/health
3. **Login API**: http://192.168.10.205:3001/api/auth/login

### Step 3: Check Firewall
On your Windows machine (server), run these commands:

```powershell
# Allow ports through Windows Firewall
netsh advfirewall firewall add rule name="BPL Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="BPL Backend" dir=in action=allow protocol=TCP localport=3001
```

### Step 4: Browser-Specific Solutions

#### Chrome/Edge:
1. Open Developer Tools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Refresh the page

#### Firefox:
1. Press `Ctrl + Shift + K` (Developer Tools)
2. Go to Network tab
3. Right-click → "Empty Cache and Hard Reload"

### Step 5: Alternative Access Methods

#### Method 1: Use Different Browser
Try accessing from:
- Chrome
- Firefox
- Edge
- Safari

#### Method 2: Mobile Device
Test from a mobile device on the same network:
- http://192.168.10.205:3000

#### Method 3: Different Computer
Test from another computer on the same network

### Step 6: Network Diagnostics

#### From the other system, test connectivity:
```bash
# Test if server is reachable
ping 192.168.10.205

# Test if ports are open
telnet 192.168.10.205 3000
telnet 192.168.10.205 3001
```

### Step 7: Check Router Settings
Some routers block internal network traffic:
1. Check router admin panel
2. Look for "AP Isolation" or "Client Isolation" settings
3. Disable if enabled

## 🚀 Quick Fixes

### Fix 1: Force Cache Clear
Add `?v=1` to the URL:
- http://192.168.10.205:3000?v=1

### Fix 2: Use IP Instead of Domain
Make sure you're using:
- `http://` (not `https://`)
- `192.168.10.205` (not `localhost`)

### Fix 3: Check Network Connection
Ensure both systems are on the same network:
- Same WiFi network
- Same subnet (192.168.10.x)

## 🔍 Common Issues

### Issue 1: "Site can't provide secure connection"
**Solution**: Use `http://` instead of `https://`

### Issue 2: "This site can't be reached"
**Solution**: Check firewall and network connectivity

### Issue 3: "Mixed content blocked"
**Solution**: Browser is blocking HTTP requests from HTTPS pages

### Issue 4: "CORS error"
**Solution**: Backend CORS is already configured correctly

## 📱 Test from Mobile
If desktop browsers don't work, try mobile:
1. Connect mobile to same WiFi
2. Open browser
3. Go to: http://192.168.10.205:3000

## 🆘 Emergency Solution
If nothing works, try this:
1. **Disable Windows Firewall temporarily**
2. **Restart both systems**
3. **Try again**

## 📞 Support
If still not working, provide:
1. Browser name and version
2. Operating system
3. Error message screenshot
4. Network configuration details
