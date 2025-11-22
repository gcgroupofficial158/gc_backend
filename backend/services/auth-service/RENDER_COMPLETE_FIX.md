# 🔧 Complete Render Deployment Fix

## Current Issues

1. ❌ Server binding to `localhost` instead of `0.0.0.0`
2. ❌ Render can't detect open ports
3. ❌ Backend not accessible

## Code Fix Applied ✅

I've updated `config.js` to default to `0.0.0.0` instead of `localhost`. This ensures the server binds to all interfaces.

## Render Dashboard Configuration

### Step 1: Fix Start Command

1. Go to **Render Dashboard** → Your Service → **Settings**
2. Scroll to **Build & Deploy**
3. **Start Command**: Change to `npm start` (NOT `npm run dev`)
4. **Build Command**: Should be `npm install` or `npm i`
5. **Root Directory**: `src/backend/services/auth-service`

### Step 2: Set Environment Variables

Go to **Environment** section and set these **EXACTLY**:

```bash
# CRITICAL - Must be set
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

# Database
MONGODB_URI=mongodb+srv://gcgroupofficial158_db_user:zHfqFKf1vBJhnqY7@cluster0.3iyatym.mongodb.net/gc_group
DB_NAME=gc_group

# JWT Secrets (Generate new ones for production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-gc-group-2024
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-gc-group-2024
JWT_REFRESH_EXPIRE=30d

# Security
BCRYPT_ROUNDS=12

# CORS - Add your frontend URL
CORS_ORIGIN=https://gc-frontend-1l2iq0poz-gcgroups-projects.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Sessions
MAX_CONCURRENT_SESSIONS=3
SESSION_TIMEOUT_MS=1800000
SESSION_CLEANUP_INTERVAL=3600000

# Logging
LOG_LEVEL=info
```

### Step 3: Verify Settings

Your Render settings should be:

```
Environment: Node
Build Command: npm install
Start Command: npm start          ← CRITICAL
Root Directory: src/backend/services/auth-service

Environment Variables:
  NODE_ENV=production
  HOST=0.0.0.0                    ← CRITICAL
  PORT=3001
  (all others listed above)
```

### Step 4: Redeploy

1. Click **Save Changes**
2. Go to **Manual Deploy**
3. Click **Deploy latest commit**
4. Watch the logs

## Expected Logs After Fix

You should see:
```
==> Running 'npm start'
> auth-service@1.0.0 start
> node server.js

🚀 Auth Service running on 0.0.0.0:3001    ← Should say 0.0.0.0, not localhost
📊 Environment: production
==> Detected open port 3001 on 0.0.0.0     ← Render detects the port
==> Your service is live at https://gc-backend-4uxu.onrender.com
```

## Troubleshooting

### If still showing "localhost":

1. **Check HOST env var**: Make sure `HOST=0.0.0.0` is set (not `HOST=localhost`)
2. **Check NODE_ENV**: Should be `production` (not `development`)
3. **Clear and reset**: Delete the env var and add it again
4. **Redeploy**: After changing env vars, always redeploy

### If port still not detected:

1. Verify the code change was deployed (check git commit)
2. Make sure `npm start` is running (not `npm run dev`)
3. Check that PORT is set (Render sets this automatically, but verify)

## Test After Deployment

Once deployed, test:
```bash
curl https://gc-backend-4uxu.onrender.com/api/v1/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

