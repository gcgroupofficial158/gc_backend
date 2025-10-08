import express from 'express';
import authRoutes from './authRoutes.js';

const router = express.Router();

// API version
const API_VERSION = 'v1';

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Auth Service is running',
    data: {
      service: 'auth-service',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'API Documentation',
    data: {
      service: 'auth-service',
      version: API_VERSION,
      endpoints: {
        auth: {
          'POST /api/v1/auth/register': 'Register new user',
          'POST /api/v1/auth/login': 'Login user',
          'POST /api/v1/auth/logout': 'Logout user (protected)',
          'POST /api/v1/auth/refresh-token': 'Refresh access token',
          'GET /api/v1/auth/verify-email/:token': 'Verify email address',
          'POST /api/v1/auth/send-email-verification': 'Send email verification',
          'POST /api/v1/auth/forgot-password': 'Send password reset email',
          'POST /api/v1/auth/reset-password': 'Reset password with token',
          'PUT /api/v1/auth/change-password': 'Change password (protected)',
          'GET /api/v1/auth/profile': 'Get user profile (protected)',
          'PUT /api/v1/auth/profile': 'Update user profile (protected)',
          'DELETE /api/v1/auth/deactivate': 'Deactivate account (protected)',
          'GET /api/v1/auth/validate-token': 'Validate token'
        },
        system: {
          'GET /api/v1/health': 'Health check',
          'GET /api/v1/docs': 'API documentation'
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Mount auth routes
router.use('/auth', authRoutes);

export default router;
