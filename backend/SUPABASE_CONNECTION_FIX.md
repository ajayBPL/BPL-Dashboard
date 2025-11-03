# Supabase Database Connection Fix Guide

## Root Cause Analysis

Based on diagnostic testing, the following issues were identified:

### Issue 1: Authentication Error (Tenant or user not found)
**Error**: `FATAL: Tenant or user not found` on pooler connection (port 6543)

**Root Causes**:
1. **Password encoding issue**: Special characters in password (`@`, `#`, etc.) may not be properly URL-encoded
2. **Connection string format**: Incorrect username format or missing required parameters
3. **Wrong password**: Password in `.env` doesn't match Supabase dashboard

### Issue 2: Network Unreachable (Direct connection)
**Error**: `Can't reach database server` on direct connection (port 5432)

**Root Causes**:
1. **VM firewall**: Outbound connections blocked on ports 5432/6543
2. **IPv6 support**: VM doesn't support IPv6 (Supabase uses IPv6 by default)
3. **Supabase project paused**: Free tier projects pause after inactivity
4. **IP ban**: Multiple failed login attempts triggered IP ban

---

## Step-by-Step Fix

### Step 1: Verify Supabase Project Status

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mwrdlemotjhrnjzncbxk`
3. Check if project is **Active** (not paused)
4. If paused, click **Resume** and wait 1-2 minutes

### Step 2: Check and Unban IP (if needed)

1. In Supabase Dashboard → **Database** → **Settings**
2. Scroll to **Network Bans** section
3. If your VM IP is listed, click **Unban IP**
4. Wait 1-2 minutes for ban to clear

### Step 3: Get Correct Connection String

1. In Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **Connection pooling** tab
4. Choose **Session mode** (recommended for Prisma)
5. Copy the connection string
6. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with your actual database password

**Expected Format**:
```
postgresql://postgres.mwrdlemotjhrnjzncbxk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Step 4: Fix Password Encoding

**CRITICAL**: If your password contains special characters, they must be URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- Space → `%20`

**Example**:
- Password: `AjayBpl@2025`
- Encoded: `AjayBpl%402025`

**Easy Fix**: Use the provided script:
```bash
cd backend
node fix-connection.js
```

This script will:
1. Prompt for your password
2. Properly encode special characters
3. Generate correct connection strings
4. Optionally update your `.env` file

### Step 5: Update .env File

Edit `backend/.env` and ensure these values are correct:

```env
# Use Session mode pooler for Prisma
DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:[ENCODED_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection for migrations (if needed)
DIRECT_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:[ENCODED_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://mwrdlemotjhrnjzncbxk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cmRsZW1vdGpocm5qem5jYnhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDQxNDMsImV4cCI6MjA2OTM4MDE0M30.b-0QzJwCbxlEqb6koGIUiEU6bC0J1zkLN0eMV5E3_Dg"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
```

**Important Notes**:
- Replace `[ENCODED_PASSWORD]` with your URL-encoded password
- Use `postgres.[PROJECT_REF]` format (not just `postgres`)
- For Prisma, use pooler connection (port 6543) with `pgbouncer=true`

### Step 6: VM-Specific Fixes

#### Fix 1: Check Firewall Rules

**Windows Firewall**:
```powershell
# Check if ports are blocked (run as Administrator)
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*PostgreSQL*"}

# Allow outbound connections (if needed)
New-NetFirewallRule -DisplayName "Allow PostgreSQL Outbound" -Direction Outbound -LocalPort 5432,6543 -Protocol TCP -Action Allow
```

**Linux (if using WSL)**:
```bash
# Check firewall
sudo ufw status

# Allow ports (if needed)
sudo ufw allow out 5432/tcp
sudo ufw allow out 6543/tcp
```

#### Fix 2: Enable IPv6 (if needed)

**Windows**:
1. Open **Network Connections**
2. Right-click your network adapter → **Properties**
3. Check **Internet Protocol Version 6 (TCP/IPv6)**
4. Click **OK** and restart network adapter

**Alternative**: Use Supavisor connection string (supports IPv4)
- In Supabase Dashboard → **Database** → **Settings**
- Look for **Supavisor** connection string (if available)

#### Fix 3: Test Network Connectivity

Run this PowerShell command:
```powershell
# Test pooler connection
Test-NetConnection -ComputerName aws-0-us-east-1.pooler.supabase.com -Port 6543

# Test direct connection
Test-NetConnection -ComputerName db.mwrdlemotjhrnjzncbxk.supabase.co -Port 5432
```

If both fail:
- Check VM's network settings
- Verify VM can access internet
- Check if corporate firewall/VPN is blocking connections

### Step 7: Test Connection

Run the diagnostic script:
```bash
cd backend
node test-db-connection.js
```

This will:
- ✅ Check environment variables
- ✅ Test network connectivity
- ✅ Test both pooler and direct connections
- ✅ Provide specific error messages and fixes

### Step 8: Generate Prisma Client

After fixing connection strings:
```bash
cd backend
npx prisma generate
```

### Step 9: Run Migrations (if needed)

```bash
cd backend
npx prisma migrate deploy
# or
npx prisma db push
```

---

## Alternative Solutions

### Solution 1: Use Transaction Mode Instead of Session Mode

If Session mode doesn't work, try Transaction mode:

```env
DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:[ENCODED_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

Note: Transaction mode has limitations (no prepared statements, no session variables).

### Solution 2: Use Supavisor (if available)

Supavisor supports IPv4 and may work better on VMs:

1. Check Supabase Dashboard → **Database** → **Settings**
2. Look for **Supavisor** connection string
3. Use that instead of pooler connection

### Solution 3: Use Direct Connection (Not Recommended)

Direct connections bypass pooling but may hit connection limits:

```env
DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:[ENCODED_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**Warning**: Direct connections may fail if:
- Port 5432 is blocked by firewall
- Supabase project is paused
- Connection limit exceeded

---

## Verification Checklist

After applying fixes, verify:

- [ ] Supabase project is **Active** (not paused)
- [ ] IP address is **not banned** (check dashboard)
- [ ] `.env` file has correct **DATABASE_URL** with encoded password
- [ ] Connection string uses **pooler** (port 6543) with `pgbouncer=true`
- [ ] Username format is `postgres.[PROJECT_REF]` (not just `postgres`)
- [ ] VM firewall allows **outbound** on ports 5432 and 6543
- [ ] VM network supports **IPv6** OR using Supavisor
- [ ] Prisma client is **generated** (`npx prisma generate`)
- [ ] Diagnostic script shows **successful connection**

---

## Quick Fix Script

Run this to automatically fix most issues:

```bash
cd backend

# 1. Fix connection strings
node fix-connection.js

# 2. Test connection
node test-db-connection.js

# 3. Generate Prisma client
npx prisma generate

# 4. Start server (will test connection on startup)
npm run dev
```

---

## Still Having Issues?

If problems persist after following all steps:

1. **Check Supabase Dashboard**:
   - Project status (Active/Paused)
   - Database logs for errors
   - Network bans
   - Connection limits

2. **Verify VM Network**:
   - Can access other HTTPS websites?
   - DNS resolution working?
   - Corporate VPN/firewall blocking?

3. **Contact Support**:
   - Supabase Support: Check dashboard for support options
   - Include diagnostic output from `test-db-connection.js`

---

## Common Error Messages and Solutions

| Error | Solution |
|-------|----------|
| `Tenant or user not found` | Fix password encoding or verify connection string format |
| `Can't reach database server` | Check firewall, IPv6 support, or resume paused project |
| `Connection timeout` | Increase timeout, check network, or verify project is active |
| `IP banned` | Unban IP in Supabase dashboard |
| `Too many connections` | Use connection pooling, reduce connection_limit |
| `Password authentication failed` | Verify password and encoding in connection string |

---

## Summary

The most common issues are:
1. **Password encoding** - Special characters must be URL-encoded
2. **VM network** - Firewall or IPv6 support issues
3. **Project status** - Supabase project might be paused
4. **IP ban** - Too many failed login attempts

Follow the steps above in order, and use the diagnostic scripts to identify specific issues.

