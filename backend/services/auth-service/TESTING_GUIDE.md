# 🧪 Session Management Testing Guide

## Prerequisites

Before running the tests, ensure you have:

1. **Node.js installed** (version 18 or higher)
2. **MongoDB running** (local or cloud)
3. **All dependencies installed**

## Installation Steps

### 1. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Or if using yarn
yarn install
```

### 2. Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Edit the .env file with your MongoDB connection string
nano .env
```

### 3. Start the Server
```bash
# Start the auth service
node server.js

# Or alternatively
node src/app.js
```

## Testing Methods

### Method 1: Automated Test Script (Recommended)

Run the comprehensive test script:

```bash
# Make the script executable (if not already done)
chmod +x test-session-management.sh

# Run the test suite
./test-session-management.sh
```

**What this tests:**
- ✅ Health check
- ✅ User registration with session creation
- ✅ User login with session management
- ✅ Get active sessions
- ✅ Deactivate specific session
- ✅ Session validation after deactivation
- ✅ Multiple device sessions
- ✅ Deactivate all sessions
- ✅ Session statistics

### Method 2: Manual API Testing

#### 1. Health Check
```bash
curl http://localhost:3001/api/v1/health
```

#### 2. Register User
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

#### 3. Login User
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

#### 4. Get Active Sessions
```bash
curl -X GET http://localhost:3001/api/v1/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5. Deactivate Specific Session
```bash
curl -X DELETE http://localhost:3001/api/v1/auth/sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 6. Deactivate All Sessions
```bash
curl -X DELETE http://localhost:3001/api/v1/auth/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 7. Get Session Statistics
```bash
curl -X GET http://localhost:3001/api/v1/auth/sessions/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Method 3: Jest Unit Tests

Run the Jest test suite:

```bash
# Run all tests
npm test

# Run only session tests
npm run test -- --testPathPattern=session

# Run with coverage
npm run test:coverage
```

## Expected Test Results

### ✅ Successful Test Output

```
🧪 Session Management Test Suite
Author: Ganesh Patel
==================================

[INFO] Testing: Health Check
[SUCCESS] Health Check - Status: 200

[INFO] Testing: User Registration
[SUCCESS] User Registration - Status: 201
[SUCCESS] Tokens and User ID extracted successfully
[SUCCESS] Session ID: abc123def456...

[INFO] Testing: User Login
[SUCCESS] User Login - Status: 200
[SUCCESS] Login tokens extracted successfully
[SUCCESS] Login Session ID: abc123def456...
[SUCCESS] Existing session detected (same device)

[INFO] Testing: Get Active Sessions
[SUCCESS] Get Active Sessions - Status: 200
[SUCCESS] Active sessions count: 1
[SUCCESS] Session details:
  - Session ID: abc123def456..., Device: Chrome on macOS, Active: true

[INFO] Testing: Deactivate Specific Session
[SUCCESS] Deactivate Specific Session - Status: 200

[INFO] Testing: Session Validation After Deactivation
[SUCCESS] Session Validation After Deactivation - Status: 401 (Expected: Session should be invalid)

[INFO] Testing: Multiple Device Sessions
[SUCCESS] Mobile Device Login - Status: 200
[SUCCESS] Mobile session created: xyz789uvw012...
[SUCCESS] New session created for different device (as expected)
[SUCCESS] Total active sessions: 2

[INFO] Testing: Deactivate All Sessions
[SUCCESS] Deactivate All Sessions - Status: 200

[INFO] Testing: Session Statistics
[SUCCESS] Session Statistics - Status: 200
[SUCCESS] Session Statistics:
  - Total Sessions: 2
  - Active Sessions: 0
  - Expired Sessions: 2
  - Total Users: 1

==================================
[INFO] Test Summary
==================================
Total Tests: 9
Passed: 9
Failed: 0
[SUCCESS] All session management tests passed! 🎉
```

## Troubleshooting

### Common Issues

#### 1. "node: command not found"
**Solution:**
```bash
# Check if Node.js is installed
which node

# If not found, install Node.js
# On macOS with Homebrew:
brew install node

# Or download from https://nodejs.org/
```

#### 2. "MongoDB connection failed"
**Solution:**
- Check if MongoDB is running
- Verify connection string in `.env` file
- Ensure MongoDB service is accessible

#### 3. "Port 3001 already in use"
**Solution:**
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env file
PORT=3002
```

#### 4. "Session not found" errors
**Solution:**
- Ensure session ID is correct
- Check if session was deactivated
- Verify token is valid and not expired

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG_SESSIONS=true
export LOG_LEVEL=debug

# Start server
node server.js
```

## Test Scenarios Covered

### 1. **Basic Session Management**
- ✅ Session creation on login
- ✅ Session validation on requests
- ✅ Session deactivation on logout

### 2. **Device Recognition**
- ✅ Same device login (existing session)
- ✅ Different device login (new session)
- ✅ Device fingerprinting accuracy

### 3. **Concurrent Session Control**
- ✅ Multiple device sessions
- ✅ Session limit enforcement
- ✅ Oldest session replacement

### 4. **Session Security**
- ✅ Session timeout handling
- ✅ Invalid session rejection
- ✅ Token-session binding

### 5. **Session Administration**
- ✅ View active sessions
- ✅ Deactivate specific sessions
- ✅ Deactivate all sessions
- ✅ Session statistics

### 6. **Session Cleanup**
- ✅ Expired session removal
- ✅ Automatic cleanup job
- ✅ Memory management

## Performance Testing

### Load Testing with Artillery

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run tests/load/session-load-test.yml
```

### Memory Usage Monitoring

```bash
# Monitor memory usage
node --inspect server.js

# Or use process monitoring
ps aux | grep node
```

## Production Testing

### 1. **Security Testing**
- Test session hijacking prevention
- Verify token binding
- Check session timeout

### 2. **Performance Testing**
- Load test with multiple users
- Memory usage monitoring
- Database performance

### 3. **Integration Testing**
- Test with frontend applications
- Verify cross-service communication
- Check error handling

## Next Steps

After successful testing:

1. **Deploy to staging environment**
2. **Run integration tests**
3. **Performance testing**
4. **Security audit**
5. **Production deployment**

## Support

If you encounter issues:

1. Check the logs in `logs/` directory
2. Verify environment configuration
3. Test with minimal setup
4. Check MongoDB connectivity
5. Review error messages carefully

---

**Happy Testing! 🚀**
