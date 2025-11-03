# Root Cause Analysis: Supabase Database Connection Issues

## 🔍 Issues Identified

### Issue 1: Authentication Error (CRITICAL)
**Error**: `FATAL: Tenant or user not found` on pooler connection (port 6543)

**Root Cause**: 
- **Password encoding issue**: The password `AjayBpl@2025` contains special character `@` which needs URL encoding as `%40`
- Current connection string may have incorrect encoding or wrong password format

**Impact**: Cannot connect to database at all

### Issue 2: Network Unreachable
**Error**: `Can't reach database server` on direct connection (port 5432)

**Root Causes**:
1. **VM Firewall**: Outbound connections to port 5432 may be blocked
2. **IPv6 Support**: Supabase uses IPv6, VM might not support it
3. **Supabase Project Paused**: Free tier projects pause after inactivity
4. **IP Ban**: Multiple failed login attempts may have banned VM's IP address

**Impact**: Cannot use direct connection, but pooler (6543) should work if password is fixed

---

## ✅ Solutions Implemented

1. **Enhanced Database Service** (`backend/src/services/database.ts`):
   - Added retry logic (3 attempts)
   - Increased timeout to 10 seconds (for VM environments)
   - Detailed error messages with specific fix suggestions
   - Better error categorization

2. **Diagnostic Script** (`backend/test-db-connection.js`):
   - Tests environment variables
   - Checks network connectivity
   - Tests both pooler and direct connections
   - Provides specific error guidance

3. **Connection Fixer Script** (`backend/fix-connection.js`):
   - Automatically URL-encodes passwords
   - Generates correct connection strings
   - Updates .env file with proper format

4. **Comprehensive Fix Guide** (`backend/SUPABASE_CONNECTION_FIX.md`):
   - Step-by-step instructions
   - VM-specific fixes
   - Troubleshooting checklist

---

## 🚀 Next Steps (Action Required)

### Step 1: Fix Password Encoding

**Option A: Use the Fix Script (Recommended)**
```bash
cd backend
node fix-connection.js
# Enter your password when prompted: AjayBpl@2025
# Choose 'yes' to update .env file
```

**Option B: Manual Fix**
1. Open `backend/.env`
2. Find `DATABASE_URL`
3. Replace the password part with URL-encoded version:
   - Current: `AjayBpl%402025` (if already encoded) or `AjayBpl@2025` (if not)
   - Should be: `AjayBpl%402025` (the `@` must be `%40`)
4. Save the file

### Step 2: Verify Supabase Project

1. Go to https://supabase.com/dashboard
2. Open project: `mwrdlemotjhrnjzncbxk`
3. Check:
   - ✅ Project status is **Active** (not paused)
   - ✅ No IP bans (Settings → Database → Network Bans)
   - ✅ Connection string format matches dashboard

### Step 3: Check VM Firewall

**Windows VM - Allow Outbound Connections**:
```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "Allow Supabase PostgreSQL Outbound" -Direction Outbound -LocalPort 5432,6543 -Protocol TCP -Action Allow
```

### Step 4: Test Connection

```bash
cd backend
node test-db-connection.js
```

This will show you exactly what's working and what's not.

### Step 5: If Still Failing - Check IPv6

**Enable IPv6 on Windows VM**:
1. Open **Network Connections** (ncpa.cpl)
2. Right-click your network adapter → **Properties**
3. Check **Internet Protocol Version 6 (TCP/IPv6)**
4. Click **OK** and restart adapter

**OR** Use Supavisor connection (supports IPv4):
- Check Supabase Dashboard → Database → Settings for Supavisor connection string

---

## 📋 Quick Fix Checklist

Run these commands in order:

```bash
cd backend

# 1. Fix connection strings (interactive - enter password)
node fix-connection.js

# 2. Verify connection
node test-db-connection.js

# 3. If connection works, generate Prisma client
npx prisma generate

# 4. Test server startup
npm run dev
```

---

## 🎯 Most Likely Fix

Based on the errors, the **most likely issue** is:

1. **Password encoding**: The `@` in `AjayBpl@2025` needs to be `%40`
2. **Connection string format**: Ensure using pooler format with `postgres.mwrdlemotjhrnjzncbxk` not just `postgres`

**Quick manual fix**:
```env
DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:AjayBpl%402025@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

---

## 📞 If Still Not Working

1. **Check Supabase Dashboard**:
   - Is project Active?
   - Any error logs?
   - IP address banned?

2. **Check VM Network**:
   - Can access other HTTPS sites?
   - DNS working?
   - Corporate firewall/VPN?

3. **Run Full Diagnostic**:
   ```bash
   cd backend
   node test-db-connection.js
   ```
   Share the output for further troubleshooting.

---

## Summary

**Primary Issue**: Password encoding in connection string
**Secondary Issue**: VM network/firewall configuration
**Fix Priority**: 
1. Fix password encoding (CRITICAL)
2. Verify Supabase project status
3. Check VM firewall settings
4. Test connection with diagnostic script

The enhanced error handling will now provide much better guidance when connections fail.

