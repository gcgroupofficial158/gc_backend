# 🔧 MongoDB Atlas Setup Guide

## Current Issue
The server is failing to connect to MongoDB Atlas with the error:
```
❌ Database connection failed: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Solution: Fix IP Whitelist

### Method 1: Add Your Current IP to Whitelist (Recommended)

1. **Get Your Current IP Address:**
   ```bash
   curl -s https://api.ipify.org
   ```

2. **Add IP to MongoDB Atlas:**
   - Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
   - Click on your cluster
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Add your current IP address
   - Click "Confirm"

### Method 2: Allow All IPs (For Development Only)

⚠️ **Security Warning**: Only use this for development/testing!

1. Go to MongoDB Atlas Dashboard
2. Navigate to "Network Access"
3. Click "Add IP Address"
4. Select "Allow Access from Anywhere" (0.0.0.0/0)
5. Add a comment like "Development - Allow All IPs"
6. Click "Confirm"

### Method 3: Use Local MongoDB (Alternative)

If you prefer to use a local MongoDB instance:

1. **Install MongoDB locally:**
   ```bash
   # On macOS with Homebrew
   brew install mongodb-community
   
   # Start MongoDB
   brew services start mongodb-community
   ```

2. **Update .env file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/gc_group
   ```

## Test the Connection

After fixing the IP whitelist, test the connection:

```bash
# Start the server
npm start

# Or
node server.js
```

**Expected Output:**
```
✅ Database connected successfully to: gc_group
🚀 Auth Service running on localhost:3001
📊 Environment: development
🔗 API Documentation: http://localhost:3001/api/v1/docs
❤️  Health Check: http://localhost:3001/api/v1/health
✅ Session cleanup job started - runs every hour
```

## Test Session Management

Once the server is running, test the session management:

```bash
# Run the comprehensive test suite
./test-session-management.sh
```

## Quick Test Commands

### 1. Health Check
```bash
curl http://localhost:3001/api/v1/health
```

### 2. Register User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123",
    "phone": "1234567890"
  }'
```

### 3. Login User
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### 4. Get Active Sessions
```bash
curl -X GET http://localhost:3001/api/v1/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Common Issues:

1. **"IP not whitelisted"**
   - Add your current IP to MongoDB Atlas whitelist
   - Wait a few minutes for changes to propagate

2. **"Authentication failed"**
   - Check username/password in connection string
   - Verify database user has proper permissions

3. **"Network timeout"**
   - Check your internet connection
   - Verify MongoDB Atlas cluster is running

4. **"Database not found"**
   - The database will be created automatically
   - Check if the database name is correct

## Security Best Practices

1. **Use Specific IPs**: Only whitelist IPs you actually use
2. **Regular IP Updates**: Update whitelist when your IP changes
3. **Strong Passwords**: Use complex passwords for database users
4. **Network Security**: Use VPC peering for production
5. **Monitoring**: Enable MongoDB Atlas monitoring

## Next Steps

1. Fix the IP whitelist issue
2. Start the server successfully
3. Run the session management tests
4. Verify all functionality works
5. Deploy to production when ready

---

**Need Help?** Check the MongoDB Atlas documentation or contact support.

