import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';

// Import configurations and middleware
import config from './config/config.js';
import database from './config/database.js';
import errorMiddleware from './middleware/error/errorMiddleware.js';
import sessionCleanupJob from './jobs/sessionCleanupJob.js';

// Import routes
import v1Routes from './routes/v1/index.js';

/**
 * Express Application
 * Main application setup and configuration
 */
class Application {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup application middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        statusCode: 429,
        message: 'Too many requests from this IP, please try again later',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Data sanitization
    this.app.use(mongoSanitize());
    this.app.use(xss());

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Request logging
    this.app.use((req, res, next) => {
      req.requestTime = new Date().toISOString();
      next();
    });
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'GC Group Auth Service',
        data: {
          service: 'auth-service',
          version: '1.0.0',
          environment: config.nodeEnv,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    });

    // API routes
    this.app.use('/api/v1', v1Routes);

    // Catch all route for undefined endpoints
    this.app.all('*', (req, res) => {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Route ${req.originalUrl} not found`,
        errors: [],
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.app.use(errorMiddleware.handleNotFound);
    this.app.use(errorMiddleware.handleError);
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Connect to database
      await database.connect();

      // Start server
      const server = this.app.listen(config.port, config.host, () => {
        console.log(`🚀 Auth Service running on ${config.host}:${config.port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🔗 API Documentation: http://${config.host}:${config.port}/api/v1/docs`);
        console.log(`❤️  Health Check: http://${config.host}:${config.port}/api/v1/health`);
        
        // Start session cleanup job
        sessionCleanupJob.start();
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(() => {
          console.log('Process terminated');
          database.disconnect();
        });
      });

      process.on('SIGINT', () => {
        console.log('SIGINT received. Shutting down gracefully...');
        server.close(() => {
          console.log('Process terminated');
          database.disconnect();
        });
      });

      return server;
    } catch (error) {
      console.error('Failed to start server:', error);
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

// Create and start application
const app = new Application();

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.start();
}

export default app;
