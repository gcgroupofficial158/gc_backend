# 🔧 Fix Render Start Command and Port Binding

## Issues Found

1. ❌ **Start Command is wrong**: `npm run dev` (using nodemon in production)
2. ❌ **Server binding to localhost**: Not accessible from Render

## Fix in Render Dashboard

### Step 1: Fix Start Command

1. Go to **Render Dashboard** → Your Service → **Settings**
2. Scroll to **Build & Deploy**
3. Find **Start Command** field
4. **Change from**: `npm run dev`
5. **Change to**: `npm start`
6. Click **Save Changes**

### Step 2: Set Environment Variables

Go to **Environment** section and add/verify:

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
```

**Important**: 
- `HOST=0.0.0.0` is **CRITICAL** - this allows Render to access your server
- `NODE_ENV=production` ensures production settings
- `PORT` is automatically set by Render, but you can set it explicitly

### Step 3: Add All Required Environment Variables

Make sure you have ALL these set:

```bash
# Server
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gc_group
DB_NAME=gc_group

# JWT (Generate new secrets!)
JWT_SECRET=<your-secret>
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=<your-secret>
JWT_REFRESH_EXPIRE=30d

# Security
BCRYPT_ROUNDS=12

# CORS (Your frontend URL)
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

### Step 4: Redeploy

After saving:
1. Go to **Manual Deploy**
2. Click **Deploy latest commit**
3. Watch the logs

## Expected Result

After fixing, you should see:
```
==> Running 'npm start'
> auth-service@1.0.0 start
> node server.js

🚀 Auth Service running on 0.0.0.0:3001
📊 Environment: production
```

And Render should detect the port:
```
==> Detected open port 3001 on 0.0.0.0
==> Your service is live at https://gc-backend-4uxu.onrender.com
```

## Code Fix Applied

I've also updated `config.js` to default to `0.0.0.0` in production mode, but you still need to:
1. Set `HOST=0.0.0.0` in Render environment variables
2. Change Start Command to `npm start`

