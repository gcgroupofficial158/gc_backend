# 🔧 Render Build Fix

## Problem
Render is running `npm` instead of `npm install` as the build command.

## Solution

### Option 1: Fix in Render Dashboard (Recommended)

1. Go to your Render service dashboard
2. Click on **Settings**
3. Scroll to **Build & Deploy**
4. Update these fields:

   **Build Command**: 
   ```
   npm install
   ```
   (NOT just `npm`)

   **Start Command**: 
   ```
   npm start
   ```

   **Root Directory**: 
   ```
   src/backend/services/auth-service
   ```
   (Based on the error path: `/opt/render/project/src/backend/services/auth-service`)

5. Click **Save Changes**
6. Trigger a new deploy

### Option 2: Use render.yaml (If supported)

The `render.yaml` file has been updated with:
- `buildCommand: npm install`
- `rootDir: src/backend/services/auth-service`

If Render supports `render.yaml` in your repo, it should pick this up automatically.

## Verify Your Settings

After updating, your Render settings should look like:

```
Environment: Node
Build Command: npm install
Start Command: npm start
Root Directory: src/backend/services/auth-service
```

## Test the Fix

1. Save the changes in Render
2. Trigger a manual deploy
3. Check the build logs - you should see:
   ```
   ==> Running build command 'npm install'...
   ```
   Instead of:
   ```
   ==> Running build command 'npm'...
   ```

## If Still Failing

If it still fails, check:
1. **Root Directory path** - The error shows `/opt/render/project/src/backend/services/auth-service/package.json`
   - This means Root Directory should be: `src/backend/services/auth-service`
   - If your repo structure is different, adjust accordingly

2. **Node version** - Should be >= 18.0.0 (already set in package.json)

3. **Build logs** - Check the full build logs for any other errors

