import express from 'express';
import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import userRoutes from './userRoutes.js';
import friendRoutes from './friendRoutes.js';
import chatRoutes from './chatRoutes.js';

const router = express.Router();

// API version
const API_VERSION = 'v1';

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const memoryUsage = process.memoryUsage();
    const healthData = {
      service: 'auth-service',
      version: API_VERSION,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStates[dbState] || 'unknown',
        connected: dbState === 1,
        name: mongoose.connection.name || 'N/A'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
        },
        cpuUsage: process.cpuUsage()
      },
      socket: {
        enabled: true,
        status: 'active'
      }
    };

    // Determine overall health status
    if (dbState !== 1) {
      healthData.status = 'degraded';
      healthData.message = 'Database connection issue';
    }

    // Always return 200 for health check (monitoring tools expect 200)
    res.status(200).json({
      success: healthData.status === 'healthy',
      statusCode: 200,
      message: healthData.status === 'healthy' 
        ? 'Auth Service is running and healthy' 
        : 'Auth Service is running but has issues',
      data: healthData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Even on error, return 200 (monitoring tools expect 200)
    res.status(200).json({
      success: false,
      statusCode: 200,
      message: 'Health check completed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

// Mount post routes
router.use('/posts', postRoutes);

// Mount user routes
router.use('/users', userRoutes);

// Mount friend routes
router.use('/friends', friendRoutes);

// Mount chat routes
router.use('/chat', chatRoutes);

export default router;
