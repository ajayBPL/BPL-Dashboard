# How to Get Correct Connection String from Supabase Dashboard

Since all connection attempts are failing with authentication errors, you need to get the **exact connection string** from your Supabase dashboard.

## Step-by-Step Instructions

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your project: **mwrdlemotjhrnjzncbxk**

### Step 2: Get Connection String
1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **Database** in the settings menu
3. Scroll down to **Connection string** section
4. You'll see tabs: **URI**, **JDBC**, **Golang**, etc.
5. Select the **URI** tab
6. You'll see options:
   - **Connection pooling** (recommended for Prisma)
   - **Direct connection**

### Step 3: Copy Pooler Connection String
1. Click on **Connection pooling** tab
2. Select **Session mode** (this is what Prisma needs)
3. You'll see a connection string like:
   ```
   postgresql://postgres.mwrdlemotjhrnjzncbxk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
4. Click the **Copy** button or select and copy the entire string

### Step 4: Update .env File
1. Open `backend/.env`
2. Find the line: `DATABASE_URL=...`
3. Replace it with the connection string you just copied
4. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with your actual database password

**Example:**
```env
DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:YOUR_ACTUAL_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**Note about password encoding:**
- If your password has special characters (@, #, $, etc.), they may need URL encoding
- The dashboard might already encode them, but if not:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`
  - Space becomes `%20`

### Step 5: Get Direct Connection String (Optional, for migrations)
1. In the same **Connection string** section
2. Select **Direct connection** tab
3. Copy that connection string
4. Update `DIRECT_URL` in your `.env` file

### Step 6: Get Database Password (if you don't know it)
1. In Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Database password** section
3. If you don't remember the password:
   - Click **Reset database password**
   - Copy the new password immediately (you won't see it again)
   - Update it in your connection string

### Step 7: Check Project Status
While you're in the dashboard:
1. Check if the project shows **Active** status (not paused)
2. If paused, click **Resume** and wait 1-2 minutes
3. Go to **Database** → **Settings** → **Network Bans**
4. Check if your VM's IP is banned - if yes, click **Unban**

### Step 8: Test Connection
After updating `.env`, run:
```bash
cd backend
node test-db-connection.js
```

---

## Quick Update Script

Once you have the connection string from the dashboard, you can use this script to update it:

**Option 1: Edit .env directly**
```bash
# Open .env file
notepad backend\.env  # Windows
# or
code backend\.env    # VS Code
```

**Option 2: Use PowerShell**
```powershell
cd backend
# Replace with your actual connection string from dashboard
$newUrl = 'postgresql://postgres.mwrdlemotjhrnjzncbxk:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
(Get-Content .env) -replace '^DATABASE_URL=.*', "DATABASE_URL=`"$newUrl`"" | Set-Content .env
```

---

## Troubleshooting

### If connection string doesn't work:
1. **Verify password**: Make sure the password in the connection string matches the one in Supabase dashboard
2. **Check encoding**: Special characters in password might need encoding
3. **Project status**: Ensure project is Active (not paused)
4. **IP ban**: Check if your IP is banned in dashboard
5. **Network**: Test if you can reach Supabase servers from your VM

### Common Issues:
- **"Tenant or user not found"**: Wrong password or wrong connection string format
- **"Can't reach database server"**: Network/firewall issue or project paused
- **"Connection timeout"**: Firewall blocking or network issues

---

## What to Copy from Dashboard

You need these two things:
1. **Connection String** (from Connection pooling → Session mode)
2. **Database Password** (from Database password section)

Then combine them to update your `.env` file.

