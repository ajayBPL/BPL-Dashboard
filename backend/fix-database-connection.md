# Supabase Database Connection Fix Guide

## Root Cause Analysis

### Issues Found:
1. **Direct Connection (Port 5432)**: Network unreachable - Port is blocked or database is paused
2. **Pooler Connection (Port 6543)**: Network reachable ✅ but authentication failing ❌
   - Error: "FATAL: Tenant or user not found"
   - This means the username/password or project configuration is incorrect

## Solution: Get Correct Connection String from Supabase Dashboard

### Steps:
1. Go to https://supabase.com/dashboard
2. Select your project: `mwrdlemotjhrnjzncbxk`
3. Go to: **Settings** → **Database**
4. Scroll to **Connection string** section
5. Select **Connection pooling** tab
6. Choose **Session mode** (recommended for Prisma)
7. Copy the connection string
8. Replace `[YOUR-PASSWORD]` with your actual password: `AjayBpl@2025`

### Expected Format:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Alternative: Use Transaction Mode

If Session mode doesn't work:
1. Try **Transaction mode** instead
2. Format: Same as above but may need different parameters

## If Project is Paused

If your Supabase project is on the free tier and paused:
1. Go to Supabase Dashboard
2. Resume the project
3. Wait for database to become available
4. Try connection again

## Test Connection

After updating .env, run:
```bash
cd backend
node test-connection-formats.js
```


