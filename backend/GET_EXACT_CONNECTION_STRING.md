# Get Exact Connection String from Supabase Dashboard

The connection is still failing. We need the **EXACT** connection string format from your Supabase dashboard to ensure it matches exactly.

## Steps to Get Exact Connection String

### Option 1: From ORMs/Prisma Tab (Recommended for Prisma)

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `mwrdlemotjhrnjzncbxk`
3. Click **Settings** (gear icon) → **Database**
4. Scroll down to **Connection string** section
5. Click on **ORMs** tab
6. Select **Prisma** from the dropdown
7. You'll see two connection strings in the `.env.local` tab:
   - **Connection Pooling URL** (this is what we need for DATABASE_URL)
   - **Direct Connection URL** (this is for DIRECT_URL)

**Copy the EXACT strings shown** - they should look like:
```
DATABASE_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.mwrdlemotjhrnjzncbxk:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

**Important**: 
- Note the **REGION** in the URL (might be different from `us-east-1`)
- Copy the exact format shown

### Option 2: From Connection String Tab

1. Go to **Settings** → **Database** → **Connection string**
2. Click on **Connection pooling** tab
3. Select **Session mode**
4. Copy the connection string shown

## What to Provide

Please provide:
1. The **exact** DATABASE_URL format from the ORMs/Prisma tab
2. The **region** shown in the URL (e.g., `ap-south-1`, `us-east-1`, etc.)
3. Confirm the password is: `AjayBpl@2025`

## Alternative: Check Project Status

While you're in the dashboard:
1. **Check if project is Active** (not paused)
2. **Check for IP bans**: Database → Settings → Network Bans
3. **Verify password**: Settings → Database → Database password section

---

Once you provide the exact connection string format, I'll update the .env file accordingly.

