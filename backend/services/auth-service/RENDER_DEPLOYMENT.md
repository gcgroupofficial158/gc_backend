# Render Deployment Guide

## Quick Setup

1. **Connect your repository** to Render
2. **Create a new Web Service**
3. **Configure the service:**

### Build & Deploy Settings

- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `gc_backend/backend/services/auth-service` (if deploying from monorepo root)

### Environment Variables

Add these in Render Dashboard → Environment:

```bash
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gc_group
DB_NAME=gc_group

# JWT (GENERATE NEW SECRETS!)
JWT_SECRET=<generate-64-char-secret>
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=<generate-64-char-secret>
JWT_REFRESH_EXPIRE=30d

# Security
BCRYPT_ROUNDS=12

# CORS (Add your production frontend URL)
CORS_ORIGIN=https://gc-frontend-ten.vercel.app

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

## Common Issues

### Issue 1: Build Fails with "npm command not found"
**Solution**: Make sure Root Directory is set correctly:
- If deploying from monorepo: `gc_backend/backend/services/auth-service`
- If deploying from service directory: leave empty

### Issue 2: "Cannot find module"
**Solution**: 
- Ensure `package.json` has correct `main` field: `"main": "server.js"`
- Ensure `start` script is: `"start": "node server.js"`

### Issue 3: Port binding error
**Solution**: 
- Set `HOST=0.0.0.0` in environment variables
- Render automatically sets `PORT` - don't hardcode it

### Issue 4: Database connection fails
**Solution**:
- Whitelist Render's IP ranges in MongoDB Atlas
- Or set MongoDB Atlas Network Access to allow all IPs (0.0.0.0/0) for testing

## Health Check

Render will automatically check: `http://your-service.onrender.com/api/v1/health`

## Auto-Deploy

- Enable **Auto-Deploy** on the `main` or `master` branch
- Render will rebuild on every push

## Custom Domain

1. Go to Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed
4. Update `CORS_ORIGIN` to include your custom domain

## Monitoring

- Check logs in Render Dashboard → Logs
- Set up alerts for deployment failures
- Monitor health check endpoint

