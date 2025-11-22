# 🔧 Fix Render Build Command in Dashboard

## The Problem
Render is running `npm` instead of `npm install` as the build command.

## The Solution

### Step-by-Step Fix:

1. **Go to Render Dashboard**
   - Navigate to your service: `gc-group-auth-service`
   - Click on **Settings** (left sidebar)

2. **Find Build & Deploy Section**
   - Scroll down to **Build & Deploy** section

3. **Update Build Command**
   - Find the field: **Build Command**
   - **Current (WRONG)**: `npm`
   - **Change to**: `npm install`
   - Make sure it says exactly: `npm install` (not just `npm`)

4. **Update Start Command**
   - Find the field: **Start Command**
   - Should be: `npm start`
   - If it's different, change it to: `npm start`

5. **Update Root Directory**
   - Find the field: **Root Directory**
   - Based on your error path `/opt/render/project/src/backend/services/auth-service`
   - Set it to: `src/backend/services/auth-service`
   - (This tells Render where your `package.json` is located)

6. **Save Changes**
   - Click **Save Changes** button at the bottom

7. **Trigger New Deploy**
   - Go to **Manual Deploy** section
   - Click **Deploy latest commit** or push a new commit

## Expected Result

After fixing, you should see in build logs:
```
==> Running build command 'npm install'...
```

Instead of:
```
==> Running build command 'npm'...
```

## Visual Guide

Your Render Settings should look like this:

```
Environment: Node
Build Command: npm install          ← FIX THIS
Start Command: npm start
Root Directory: src/backend/services/auth-service
```

## If You Can't Find These Settings

1. Make sure you're in the **Settings** tab (not Overview or Logs)
2. Scroll down - Build & Deploy section is usually near the bottom
3. If you still can't find it, you might need to:
   - Delete the service and recreate it
   - Or contact Render support

## Alternative: Use Blueprint (render.yaml)

If dashboard settings aren't working, you can create a `render.yaml` file at the **root of your repository** (not in the service folder):

```yaml
services:
  - type: web
    name: gc-group-auth-service
    env: node
    buildCommand: npm install
    startCommand: npm start
    rootDir: src/backend/services/auth-service
```

Then in Render Dashboard:
- Go to **Blueprints** section
- Connect your repo
- Render will detect and use `render.yaml`

