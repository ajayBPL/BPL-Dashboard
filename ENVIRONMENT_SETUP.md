# Environment Configuration Guide

This guide explains how to set up environment variables for BPL Commander in both development and production environments.

## 📋 Quick Start

### Backend Environment Setup

1. **Initialize .env file** (if not exists):
   ```bash
   cd backend
   node scripts/init-env.js
   ```

   Or manually:
   ```bash
   cp env.example .env
   ```

2. **Update all placeholder values** in `backend/.env`:
   - Supabase credentials
   - Database connection string
   - JWT secret (generate with: `npm run env:generate-jwt`)
   - CORS origin
   - SMTP settings (optional)

3. **Validate configuration**:
   ```bash
   npm run env:validate
   ```

### Frontend Environment Setup

1. **Create `.env` file** in `frontend/` directory:
   ```bash
   cd frontend
   touch .env
   ```

2. **Add required variables**:
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_API_HEALTH_URL=http://localhost:3001/health
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PROJECT_ID=your-project-id
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **For production**, update URLs:
   ```env
   VITE_API_URL=https://api.yourdomain.com/api
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PROJECT_ID=your-project-id
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

## 🔐 Backend Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres.project:pass@host:6543/postgres` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Get from Supabase Dashboard |
| `JWT_SECRET` | Secret for JWT tokens (64+ chars) | Generate with `npm run env:generate-jwt` |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `CORS_ORIGIN` | Allowed frontend URL | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin operations) | - |
| `SMTP_HOST` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |

See `backend/env.example` for complete list with descriptions.

## 🌐 Frontend Environment Variables

All frontend environment variables must be prefixed with `VITE_` to be accessible in the application.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` |
| `VITE_API_HEALTH_URL` | Health check endpoint | `http://localhost:3001/health` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | `xxx` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Get from Supabase Dashboard |

## 🔧 Helper Scripts

### Backend Scripts

#### Validate Environment Configuration
```bash
cd backend
npm run env:validate
```
Checks that all required variables are set and properly formatted.

#### Generate JWT Secret
```bash
cd backend
npm run env:generate-jwt [length]
```
Generates a cryptographically secure random string for `JWT_SECRET`. Default length: 64 characters.

#### Initialize .env File
```bash
cd backend
node scripts/init-env.js
```
Creates `.env` file from `env.example` if it doesn't exist.

## 📝 Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
5. Go to **Settings** → **Database**
6. Copy **Connection string** (Pooler mode) → `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - URL-encode special characters (e.g., `@` becomes `%40`)

## ✅ Production Checklist

Before deploying to production:

- [ ] `.env` file exists and is configured
- [ ] `JWT_SECRET` is generated (64+ characters) and not the default value
- [ ] `NODE_ENV` is set to `"production"`
- [ ] `CORS_ORIGIN` points to production frontend URL (not localhost)
- [ ] All Supabase credentials are set correctly
- [ ] Database connection string includes correct password (URL-encoded)
- [ ] SMTP settings configured (if using email features)
- [ ] All placeholder values (`your_*`, `your-*`) are replaced
- [ ] `.env` file is NOT committed to git (verify with `git status`)
- [ ] Run `npm run env:validate` - all checks pass
- [ ] Frontend `.env` has production URLs

## 🚨 Security Notes

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong secrets** - JWT_SECRET should be 64+ characters in production
3. **Keep service role key secret** - Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend
4. **URL-encode passwords** - Special characters in DATABASE_URL passwords must be encoded
5. **Use HTTPS in production** - Update CORS_ORIGIN and API URLs to use HTTPS
6. **Rotate secrets periodically** - Especially after any security incidents

## 🔍 Troubleshooting

### Environment variables not loading
- Ensure `.env` file is in the correct directory (`backend/.env` or `frontend/.env`)
- Check file has no syntax errors (no missing quotes, etc.)
- Restart the development server after changing `.env`

### Validation fails
- Run `npm run env:validate` to see specific errors
- Check all required variables are set
- Verify no placeholder values remain
- Ensure URLs are properly formatted

### Database connection fails
- Verify `DATABASE_URL` format is correct
- Check password is URL-encoded if it contains special characters
- Ensure Supabase project is active (not paused)
- Check network/firewall allows connection to Supabase

## 📚 Additional Resources

- Backend example: `backend/env.example`
- Secure template: `backend/env.secure.template`
- Setup scripts: `setup-production.bat` / `setup-production.sh`

