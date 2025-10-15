# Network Configuration for BPL Commander Application

## Current Network Setup
- **Frontend**: http://localhost:3004 (Vite automatically found available port)
- **Backend**: http://localhost:3003 (running on configured port)
- **Network IP**: 192.168.10.205 (your current network IP)

## Access URLs

### Local Access (Same Machine)
- **Frontend**: http://localhost:3004
- **Backend API**: http://localhost:3003
- **Health Check**: http://localhost:3003/health

### Network Access (Other Devices on Same Network)
- **Frontend**: http://192.168.10.205:3004
- **Backend API**: http://192.168.10.205:3003
- **Health Check**: http://192.168.10.205:3003/health

## Configuration Files Updated
1. **frontend/src/utils/apiConfig.ts** - Updated API endpoints to use port 3003
2. **frontend/src/services/websocketClient.ts** - Updated WebSocket URL to use port 3003
3. **backend/.env** - Updated CORS_ORIGIN for network access

## Testing Network Access
To test if other devices can access the application:

1. **From another device on the same network:**
   - Open browser and go to: http://192.168.10.205:3004
   - Should load the BPL Commander application

2. **Test API from another device:**
   ```bash
   curl http://192.168.10.205:3003/health
   ```

## Login Credentials (Same for All Devices)
- **Email**: admin@bplcommander.com
- **Password**: Admin123!

- **Email**: manager@bplcommander.com  
- **Password**: Admin123!

- **Email**: employee@bplcommander.com
- **Password**: Admin123!

## Troubleshooting
If network access doesn't work:
1. Check Windows Firewall settings
2. Ensure both ports 3004 and 3003 are not blocked
3. Verify devices are on the same network
4. Check if antivirus is blocking connections