import request from 'supertest';
import app from '../src/app.js';
import { faker } from '@faker-js/faker';

describe('Session Management Tests', () => {
  let testUser;
  let accessToken;
  let refreshToken;
  let sessionId;

  beforeAll(async () => {
    // Register a test user
    const userData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: 'Password123',
      phone: faker.phone.number()
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(registerResponse.status).toBe(201);
    testUser = registerResponse.body.data.user;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser) {
      await request(app)
        .delete('/api/v1/auth/deactivate')
        .set('Authorization', `Bearer ${accessToken}`);
    }
  });

  describe('Login with Session Management', () => {
    it('should create a new session on login', async () => {
      const loginData = {
        email: testUser.email,
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('session');

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
      sessionId = response.body.data.session.sessionId;

      expect(sessionId).toBeDefined();
      expect(response.body.data.session.deviceInfo).toBeDefined();
    });

    it('should return existing session for same device', async () => {
      const loginData = {
        email: testUser.email,
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.data.session.isExistingSession).toBe(true);
      expect(response.body.data.session.sessionId).toBe(sessionId);
    });
  });

  describe('Session Management Endpoints', () => {
    it('should get active sessions', async () => {
      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeInstanceOf(Array);
      expect(response.body.data.sessions.length).toBeGreaterThan(0);
    });

    it('should deactivate specific session', async () => {
      const response = await request(app)
        .delete(`/api/v1/auth/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow access with deactivated session', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Multiple Device Sessions', () => {
    let secondAccessToken;
    let secondSessionId;

    it('should create new session for different device', async () => {
      // Simulate different device by changing User-Agent
      const loginData = {
        email: testUser.email,
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.data.session.isExistingSession).toBe(false);
      expect(response.body.data.session.sessionId).not.toBe(sessionId);

      secondAccessToken = response.body.data.accessToken;
      secondSessionId = response.body.data.session.sessionId;
    });

    it('should show multiple active sessions', async () => {
      const response = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${secondAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sessions.length).toBe(2);
    });

    it('should deactivate all sessions', async () => {
      const response = await request(app)
        .delete('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${secondAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow access after deactivating all sessions', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${secondAccessToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Session Statistics', () => {
    it('should get session statistics', async () => {
      // Login again to have active sessions
      const loginData = {
        email: testUser.email,
        password: 'Password123'
      };

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      accessToken = loginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/v1/auth/sessions/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSessions');
      expect(response.body.data).toHaveProperty('activeSessions');
      expect(response.body.data).toHaveProperty('expiredSessions');
      expect(response.body.data).toHaveProperty('totalUsers');
    });
  });

  describe('Session Timeout', () => {
    it('should handle session timeout', async () => {
      // This test would require mocking time or waiting for actual timeout
      // For now, we'll test the session validation logic
      const response = await request(app)
        .get('/api/v1/auth/validate-token')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.valid).toBe(true);
    });
  });
});
