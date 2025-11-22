# CORS Fix Guide

## Issue
OPTIONS preflight requests are failing, preventing the frontend from making API calls.

## Root Cause
The `CORS_ORIGIN` environment variable in Render is likely set to `http://localhost:3000` instead of your production frontend URL.

## Fix Steps

### 1. Update CORS_ORIGIN in Render Dashboard

1. Go to **Render Dashboard** → Your service
2. Click **Environment** (left sidebar)
3. Find `CORS_ORIGIN` variable
4. **Current value (WRONG):**
   ```
   http://localhost:3000
   ```
5. **Change to (CORRECT):**
   ```
   https://gc-frontend-1l2iq0poz-gcgroups-projects.vercel.app
   ```
6. Click **Save Changes**
7. Go to **Manual Deploy** → **Deploy latest commit**

### 2. Verify Environment Variables

Make sure these are set correctly in Render:

```
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
CORS_ORIGIN=https://gc-frontend-1l2iq0poz-gcgroups-projects.vercel.app
```

### 3. Check Backend Logs

After redeploying, check the Render logs. You should see:
- `🔵 OPTIONS preflight: Origin=...` logs
- `✅ CORS: Allowing origin ...` logs

If you see `⚠️ CORS: Origin ... not in allowed list`, the CORS_ORIGIN is still wrong.

### 4. Test CORS

After updating, test with:

```bash
curl -X OPTIONS \
  -H "Origin: https://gc-frontend-1l2iq0poz-gcgroups-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v https://gc-group-backend.com/api/v1/auth/login
```

You should get a `204 No Content` response with these headers:
- `Access-Control-Allow-Origin: https://gc-frontend-1l2iq0poz-gcgroups-projects.vercel.app`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`
- `Access-Control-Allow-Credentials: true`

## Multiple Frontend URLs

If you have multiple frontend URLs (staging + production), set CORS_ORIGIN as comma-separated:

```
CORS_ORIGIN=https://gc-frontend-1l2iq0poz-gcgroups-projects.vercel.app,https://staging.example.com
```

## Temporary Debug Mode

The code now temporarily allows all origins for debugging. Once CORS_ORIGIN is set correctly, you can remove the permissive fallback in `app.js` line 95-96.

## Common Mistakes

1. ❌ Using `http://localhost:3000` in production
2. ❌ Missing `https://` prefix
3. ❌ Trailing slash: `https://example.com/` (should be `https://example.com`)
4. ❌ Wrong domain (check your actual Vercel deployment URL)

