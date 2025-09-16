# Network Access Configuration

## For Other Systems on Your Network

### Your Current IP: `192.168.29.213`

### Option 1: Environment Variables (Recommended)

Create a `.env.local` file in the `frontend` directory with:

```bash
# Network Access Configuration
VITE_API_URL=http://192.168.29.213:3001/api
VITE_API_HEALTH_URL=http://192.168.29.213:3001/health
```

Then restart the frontend:
```bash
npm run dev --prefix frontend
```

### Option 2: Direct Access URLs

**Frontend (React App):**
- http://192.168.29.213:3000

**Backend API:**
- http://192.168.29.213:3001

### Option 3: Update API Config Directly

Modify `frontend/src/utils/apiConfig.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.29.213:3001/api';
const API_HEALTH_URL = import.meta.env.VITE_API_HEALTH_URL || 'http://192.168.29.213:3001/health';
```

### Testing Network Access

From another system on your network:

1. **Test Frontend:** http://192.168.29.213:3000
2. **Test Backend:** http://192.168.29.213:3001/health
3. **Test Login:** http://192.168.29.213:3001/api/auth/login

### Firewall Considerations

Make sure Windows Firewall allows:
- Port 3000 (Frontend)
- Port 3001 (Backend)

### Login Credentials

- Email: `inderjot.singh@bpl.in`
- Password: `defaultpass123`

