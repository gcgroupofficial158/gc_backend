import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configuration and database
import config from './config/config.js';
import database from './config/database.js';

// Import middleware
import errorMiddleware from './middleware/error/errorMiddleware.js';

// Import routes
import profileRoutes from './routes/v1/profileRoutes.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Profile Service Application
 * Express application for profile management
 */
class ProfileServiceApp {
  constructor() {
    this.app = express();
    this.port = config.port;
    this.host = config.host;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS middleware
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        statusCode: 429,
        message: 'Too many requests',
        error: 'Rate limit exceeded. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static file serving for uploads
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Profile Service is healthy',
        data: {
          service: 'Profile Service',
          version: '1.0.0',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.nodeEnv
        }
      });
    });

    // API routes
    this.app.use('/api/v1/profiles', profileRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Profile Service API',
        data: {
          service: 'Profile Service',
          version: '1.0.0',
          description: 'Profile management microservice for GC Group',
          author: 'Ganesh Patel',
          endpoints: {
            health: '/health',
            profiles: '/api/v1/profiles',
            documentation: '/api/v1/docs'
          }
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Endpoint not found',
        error: `Cannot ${req.method} ${req.originalUrl}`
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use(errorMiddleware.globalErrorHandler);

    // Handle unhandled promise rejections
    errorMiddleware.handleUnhandledRejection();

    // Handle uncaught exceptions
    errorMiddleware.handleUncaughtException();
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Connect to database
      await database.connect();

      // Start server
      this.app.listen(this.port, this.host, () => {
        console.log('🚀 Profile Service started successfully!');
        console.log(`📍 Server running on http://${this.host}:${this.port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🔗 Health Check: http://${this.host}:${this.port}/health`);
        console.log(`📚 API Documentation: http://${this.host}:${this.port}/api/v1/profiles`);
        console.log(`💾 Database: ${config.mongodb.dbName}`);
        console.log(`📁 Upload Path: ${config.upload.uploadPath}`);
        console.log('=====================================');
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      console.error('❌ Failed to start Profile Service:', error.message);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Close database connection
      await database.disconnect();
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error.message);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  getApp() {
    return this.app;
  }
}

// Create and start the application
const app = new ProfileServiceApp();

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.start();
}

export default app;
