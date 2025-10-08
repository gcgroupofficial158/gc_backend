# Auth Service Test Suite

Comprehensive testing suite for the GC Group Auth Service including unit tests, integration tests, and load testing.

**Author:** Ganesh Patel

## Test Structure

```
tests/
├── fixtures/           # Test data and fixtures
├── helpers/           # Test helper functions
├── unit/              # Unit tests
│   ├── services/      # Service layer tests
│   └── models/        # Model tests
├── integration/       # Integration tests
├── load/              # Load and performance tests
│   ├── load-test.yml      # Standard load test
│   ├── stress-test.yml    # Stress test
│   └── performance-test.yml # Performance test
├── setup.js           # Test setup configuration
└── run-tests.sh       # Test runner script
```

## Test Types

### 1. Unit Tests
- **Location:** `tests/unit/`
- **Purpose:** Test individual components in isolation
- **Coverage:** Services, models, utilities, middleware
- **Dependencies:** Mocked external dependencies

### 2. Integration Tests
- **Location:** `tests/integration/`
- **Purpose:** Test API endpoints and component interactions
- **Coverage:** All API endpoints, authentication flows, error handling
- **Dependencies:** Real database (in-memory), actual HTTP requests

### 3. Load Tests
- **Location:** `tests/load/`
- **Purpose:** Test system performance under various load conditions
- **Tools:** Artillery.io
- **Scenarios:** Registration, login, profile access, concurrent operations

## Running Tests

### Prerequisites
1. Install dependencies: `npm install`
2. Start the auth service: `npm start`
3. Ensure MongoDB is accessible

### Quick Start
```bash
# Run all tests
./tests/run-tests.sh all

# Run specific test types
./tests/run-tests.sh unit
./tests/run-tests.sh integration
./tests/run-tests.sh load
```

### Individual Test Commands
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# All Jest tests
npm test

# Load tests
npm run test:load

# Generate coverage report
npm run test:coverage
```

## Test Scenarios

### Unit Test Scenarios

#### AuthService Tests
- ✅ User registration with valid data
- ✅ User registration with duplicate email
- ✅ User login with valid credentials
- ✅ User login with invalid credentials
- ✅ User logout functionality
- ✅ Token refresh mechanism
- ✅ Password validation
- ✅ Account lockout after failed attempts
- ✅ Email verification flow
- ✅ Password reset flow

#### User Model Tests
- ✅ User creation and validation
- ✅ Password hashing
- ✅ Email uniqueness
- ✅ Field validation
- ✅ Virtual properties
- ✅ Instance methods
- ✅ Static methods
- ✅ Index creation

### Integration Test Scenarios

#### Authentication Flow
- ✅ User registration → Login → Profile access
- ✅ Token-based authentication
- ✅ Refresh token mechanism
- ✅ Logout and token invalidation

#### API Endpoints
- ✅ POST /api/v1/auth/register
- ✅ POST /api/v1/auth/login
- ✅ POST /api/v1/auth/logout
- ✅ POST /api/v1/auth/refresh-token
- ✅ GET /api/v1/auth/profile
- ✅ PUT /api/v1/auth/profile
- ✅ PUT /api/v1/auth/change-password
- ✅ GET /api/v1/health
- ✅ GET /api/v1/docs

#### Error Handling
- ✅ Validation errors
- ✅ Authentication errors
- ✅ Authorization errors
- ✅ Rate limiting
- ✅ Malformed requests

### Load Test Scenarios

#### Standard Load Test
- **Duration:** 5 minutes
- **Peak Load:** 100 requests/second
- **Scenarios:** Health checks, registration, login, profile access
- **Expected Performance:** P95 < 1000ms, P99 < 2000ms

#### Stress Test
- **Duration:** 7 minutes
- **Peak Load:** 500 requests/second
- **Scenarios:** High-volume operations, concurrent requests
- **Expected Performance:** P95 < 2000ms, P99 < 5000ms

#### Performance Test
- **Duration:** 5 minutes
- **Sustained Load:** 30-50 requests/second
- **Scenarios:** Response time optimization
- **Expected Performance:** P50 < 100ms, P95 < 500ms

## Test Data

### User Test Data
- **Valid User:** Complete user data with valid email, password, phone
- **Admin User:** User with admin role
- **Invalid User:** Data with validation errors
- **Random Users:** Generated test data for load testing

### Authentication Data
- **Valid Credentials:** Correct email/password combination
- **Invalid Credentials:** Wrong password
- **Non-existent User:** Email not in database
- **Test Tokens:** JWT tokens for testing

## Performance Benchmarks

### Response Time Targets
- **Health Check:** < 50ms (P95)
- **User Registration:** < 200ms (P95)
- **User Login:** < 150ms (P95)
- **Profile Access:** < 100ms (P95)
- **Token Refresh:** < 100ms (P95)

### Throughput Targets
- **Concurrent Users:** 100+ simultaneous
- **Requests per Second:** 50+ sustained
- **Peak Load:** 100+ requests/second
- **Error Rate:** < 1% under normal load

### Resource Usage
- **Memory:** < 512MB under load
- **CPU:** < 80% under peak load
- **Database Connections:** < 20 concurrent

## Test Coverage

### Target Coverage
- **Overall:** > 90%
- **Services:** > 95%
- **Models:** > 90%
- **Controllers:** > 85%
- **Middleware:** > 80%

### Coverage Reports
- **Location:** `coverage/lcov-report/index.html`
- **Format:** HTML and LCOV
- **Generated:** After running `npm run test:coverage`

## Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### Local Development
```bash
# Watch mode for development
npm run test:watch

# Run tests on file changes
npm run test:watch -- --watchAll
```

## Troubleshooting

### Common Issues

#### Tests Failing
1. **Service not running:** Start with `npm start`
2. **Database connection:** Check MongoDB URI
3. **Port conflicts:** Ensure port 3001 is available
4. **Dependencies:** Run `npm install`

#### Load Tests Failing
1. **Service overloaded:** Reduce load test intensity
2. **Database limits:** Check MongoDB connection limits
3. **Memory issues:** Monitor system resources

#### Coverage Issues
1. **Missing tests:** Add tests for uncovered code
2. **Mock issues:** Check mock implementations
3. **Async tests:** Ensure proper async/await usage

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test file
npm test -- tests/unit/services/authService.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should register"
```

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert:** Structure tests clearly
2. **Descriptive Names:** Use clear test descriptions
3. **Single Responsibility:** One assertion per test
4. **Mock External Dependencies:** Keep tests isolated
5. **Clean Up:** Reset state between tests

### Test Data
1. **Use Fixtures:** Consistent test data
2. **Random Data:** For load testing
3. **Edge Cases:** Test boundary conditions
4. **Invalid Data:** Test error handling

### Performance Testing
1. **Start Small:** Begin with low load
2. **Gradual Increase:** Ramp up slowly
3. **Monitor Resources:** Watch CPU, memory, database
4. **Realistic Scenarios:** Use real-world patterns

## Contributing

### Adding New Tests
1. Follow existing test structure
2. Use descriptive test names
3. Include both positive and negative cases
4. Update this documentation

### Test Maintenance
1. Keep tests up to date with code changes
2. Remove obsolete tests
3. Update test data as needed
4. Monitor test performance

## Support

For questions or issues with the test suite:
- Check this documentation
- Review test logs and error messages
- Ensure all prerequisites are met
- Contact: Ganesh Patel
