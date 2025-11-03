# Quick Fix: Supabase Database Connection

## 🚨 Current Status
All connection attempts are failing with authentication errors. This means:
- ❌ The passwords in `.env` are likely incorrect
- ❌ Or the connection string format doesn't match Supabase dashboard

## ✅ Solution: Get Connection String from Dashboard

### Step 1: Get Connection String (5 minutes)

1. **Go to Supabase Dashboard**:
   - URL: https://supabase.com/dashboard
   - Project: `mwrdlemotjhrnjzncbxk`

2. **Navigate to Database Settings**:
   - Click **Settings** (gear icon) → **Database**

3. **Copy Connection String**:
   - Scroll to **Connection string** section
   - Click **Connection pooling** tab
   - Select **Session mode**
   - Click **Copy** button

4. **Get Database Password**:
   - In the same Database settings page
   - Scroll to **Database password** section
   - If you don't remember it, click **Reset database password**
   - Copy the password immediately

5. **Combine them**:
   - The connection string will have `[YOUR-PASSWORD]` placeholder
   - Replace it with your actual password

### Step 2: Update .env File

**Option A: Manual Edit**
```powershell
cd backend
notepad .env
# Find DATABASE_URL line and replace with the connection string from dashboard
```

**Option B: Use PowerShell Script**
```powershell
cd backend
.\update-connection.ps1 "postgresql://postgres.mwrdlemotjhrnjzncbxk:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**Option C: Direct PowerShell Command**
```powershell
cd backend
$connectionString = Read-Host "Paste the connection string from dashboard"
(Get-Content .env) -replace '^DATABASE_URL=.*', "DATABASE_URL=`"$connectionString`"" | Set-Content .env
```

### Step 3: Test Connection

```bash
cd backend
node test-db-connection.js
```

You should see: `✅ SUCCESS: DATABASE_URL (Pooler) connection works!`

### Step 4: Setup Database

Once connection works:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (if tables don't exist)
npx prisma db push

# OR run migrations (if you have migrations)
npx prisma migrate deploy
```

### Step 5: Start Server

```bash
npm run dev
```

The server should now connect to the database successfully!

---

## 🔍 While You're in the Dashboard

While checking the connection string, also verify:

1. **Project Status**: Is it **Active**? (not paused)
2. **IP Bans**: Go to Database → Settings → Network Bans
   - If your VM's IP is listed, click **Unban**
3. **Connection String Format**: Make sure you're copying from:
   - **Connection pooling** tab (not Direct connection)
   - **Session mode** (not Transaction mode)

---

## ⚠️ Common Mistakes

1. **Not replacing `[YOUR-PASSWORD]`**: The connection string has a placeholder - you must replace it
2. **Wrong mode**: Must use **Session mode** for Prisma (not Transaction mode)
3. **Direct connection**: Don't use Direct connection string - use Pooler (port 6543)
4. **Password encoding**: If password has special characters, they may need URL encoding:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`

---

## 📞 Still Not Working?

If you've updated the connection string from dashboard and it still fails:

1. **Run full diagnostic**:
   ```bash
   node test-db-connection.js
   ```

2. **Check the error message**:
   - "Tenant or user not found" → Wrong password or format
   - "Can't reach database server" → Network/firewall issue
   - "Connection timeout" → Firewall blocking or project paused

3. **Verify in dashboard**:
   - Project is Active
   - IP is not banned
   - Connection string matches exactly what's in dashboard

4. **Check VM network**:
   - Can access other HTTPS websites?
   - Firewall allows outbound on ports 5432/6543?

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ `test-db-connection.js` shows "SUCCESS"
- ✅ Server starts without database connection errors
- ✅ You can access API endpoints that use the database

---

**Time Estimate**: 5-10 minutes to get connection string and update .env

