import request from 'supertest';
import app from '../src/app.js';

describe('Auth Service API', () => {
  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.service).toBe('auth-service');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123',
        phone: '+1234567890'
      };

      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        firstName: 'J',
        lastName: 'D',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app.getApp())
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'Password123'
      };

      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const invalidData = {
        email: 'john.doe@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app.getApp())
        .post('/api/v1/auth/login')
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
