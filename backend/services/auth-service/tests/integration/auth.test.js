import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { 
  validUserData, 
  adminUserData, 
  loginCredentials, 
  invalidUserData,
  profileUpdateData,
  changePasswordData,
  apiEndpoints,
  expectedResponses
} from '../fixtures/testData.js';
import TestHelpers from '../helpers/testHelpers.js';

describe('Auth API Integration Tests', () => {
  let server;
  let authToken;
  let refreshToken;
  let userId;

  beforeAll(async () => {
    // Start the server
    server = app.getApp();
  });

  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});
    authToken = null;
    refreshToken = null;
    userId = null;
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.register)
        .send(validUserData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      
      // Store tokens for other tests
      authToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
      userId = response.body.data.user.id;
    });

    it('should return validation error for invalid data', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.register)
        .send(invalidUserData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return conflict error for duplicate email', async () => {
      // Arrange
      const user1 = new User(validUserData);
      await user1.save();

      // Act
      const response = await request(server)
        .post(apiEndpoints.register)
        .send(validUserData)
        .expect(409);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should register admin user successfully', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.register)
        .send(adminUserData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User(validUserData);
      await user.save();
    });

    it('should login with valid credentials', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.login)
        .send(loginCredentials.valid)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginCredentials.valid.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      
      // Store tokens for other tests
      authToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
      userId = response.body.data.user.id;
    });

    it('should return unauthorized for invalid credentials', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.login)
        .send(loginCredentials.invalid)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return unauthorized for non-existent user', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.login)
        .send(loginCredentials.nonExistent)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return validation error for missing fields', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.login)
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    beforeEach(async () => {
      // Create and login a user
      const user = new User(validUserData);
      await user.save();
      
      const loginResponse = await request(server)
        .post(apiEndpoints.login)
        .send(loginCredentials.valid);
      
      authToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
      userId = loginResponse.body.data.user.id;
    });

    it('should logout successfully with valid token', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.logout)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ refreshToken })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should return unauthorized without token', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.logout)
        .send({ refreshToken })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return unauthorized with invalid token', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.logout)
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    beforeEach(async () => {
      // Create and login a user
      const user = new User(validUserData);
      await user.save();
      
      const loginResponse = await request(server)
        .post(apiEndpoints.login)
        .send(loginCredentials.valid);
      
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token successfully', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.refreshToken)
        .send({ refreshToken })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for invalid refresh token', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.refreshToken)
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for missing refresh token', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.refreshToken)
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    beforeEach(async () => {
      // Create and login a user
      const user = new User(validUserData);
      await user.save();
      
      const loginResponse = await request(server)
        .post(apiEndpoints.login)
        .send(loginCredentials.valid);
      
      authToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
    });

    it('should get user profile successfully', async () => {
      // Act
      const response = await request(server)
        .get(apiEndpoints.profile)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data.firstName).toBe(validUserData.firstName);
      expect(response.body.data.lastName).toBe(validUserData.lastName);
    });

    it('should return unauthorized without token', async () => {
      // Act
      const response = await request(server)
        .get(apiEndpoints.profile)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return unauthorized with invalid token', async () => {
      // Act
      const response = await request(server)
        .get(apiEndpoints.profile)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    beforeEach(async () => {
      // Create and login a user
      const user = new User(validUserData);
      await user.save();
      
      const loginResponse = await request(server)
        .post(apiEndpoints.login)
        .send(loginCredentials.valid);
      
      authToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
    });

    it('should update user profile successfully', async () => {
      // Act
      const response = await request(server)
        .put(apiEndpoints.profile)
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileUpdateData.valid)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(profileUpdateData.valid.firstName);
      expect(response.body.data.lastName).toBe(profileUpdateData.valid.lastName);
      expect(response.body.data.phone).toBe(profileUpdateData.valid.phone);
    });

    it('should return validation error for invalid data', async () => {
      // Act
      const response = await request(server)
        .put(apiEndpoints.profile)
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileUpdateData.invalid)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return unauthorized without token', async () => {
      // Act
      const response = await request(server)
        .put(apiEndpoints.profile)
        .send(profileUpdateData.valid)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/change-password', () => {
    beforeEach(async () => {
      // Create and login a user
      const user = new User(validUserData);
      await user.save();
      
      const loginResponse = await request(server)
        .post(apiEndpoints.login)
        .send(loginCredentials.valid);
      
      authToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
    });

    it('should change password successfully', async () => {
      // Act
      const response = await request(server)
        .put(apiEndpoints.changePassword)
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData.valid)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');
    });

    it('should return error for incorrect current password', async () => {
      // Act
      const response = await request(server)
        .put(apiEndpoints.changePassword)
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData.invalid)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should return validation error for same password', async () => {
      // Act
      const response = await request(server)
        .put(apiEndpoints.changePassword)
        .set('Authorization', `Bearer ${authToken}`)
        .send(changePasswordData.samePassword)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return unauthorized without token', async () => {
      // Act
      const response = await request(server)
        .put(apiEndpoints.changePassword)
        .send(changePasswordData.valid)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      // Act
      const response = await request(server)
        .get(apiEndpoints.health)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('auth-service');
      expect(response.body.data.version).toBe('v1');
    });
  });

  describe('GET /api/v1/docs', () => {
    it('should return API documentation', async () => {
      // Act
      const response = await request(server)
        .get(apiEndpoints.docs)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.endpoints).toBeDefined();
      expect(response.body.data.endpoints.auth).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting', async () => {
      // Arrange
      const requests = Array(110).fill().map(() => 
        request(server).get(apiEndpoints.health)
      );

      // Act
      const responses = await Promise.all(requests);

      // Assert
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      // Act
      const response = await request(server)
        .get('/api/v1/non-existent')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle malformed JSON', async () => {
      // Act
      const response = await request(server)
        .post(apiEndpoints.register)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });
});
