import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import configurations and middleware
import config from './config/config.js';
import database from './config/database.js';
import errorMiddleware from './middleware/error/errorMiddleware.js';
import sessionCleanupJob from './jobs/sessionCleanupJob.js';
import SocketHandler from './socket/socketHandler.js';

// Import routes
import v1Routes from './routes/v1/index.js';

/**
 * Express Application
 * Main application setup and configuration
 */
class Application {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
        methods: ['GET', 'POST']
      }
    });
    this.socketHandler = null;
    // Make io available globally for controllers
    this.app.set('io', this.io);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup application middleware
   */
  setupMiddleware() {
    // Handle OPTIONS preflight requests FIRST - before any other middleware
    this.app.options('*', (req, res) => {
      const origin = req.headers.origin;
      const allowedOrigins = Array.isArray(config.cors.origin) 
        ? config.cors.origin 
        : [config.cors.origin];
      
      console.log(`🔵 OPTIONS preflight: Origin=${origin}, Allowed=${JSON.stringify(allowedOrigins)}`);
      
      if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.sendStatus(204);
      }
      
      // Origin not in allowed list - reject
      console.warn(`❌ OPTIONS: Blocked origin ${origin}. Allowed: ${JSON.stringify(allowedOrigins)}`);
      return res.status(403).json({ 
        success: false, 
        message: 'CORS: Origin not allowed',
        allowedOrigins 
      });
    });

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:", "http://localhost:*", "http://127.0.0.1:*"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration - must be before other middleware
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          console.log('🔵 CORS: No origin header, allowing request');
          return callback(null, true);
        }
        
        const allowedOrigins = Array.isArray(config.cors.origin) 
          ? config.cors.origin 
          : [config.cors.origin];
        
        console.log(`🔵 CORS: Checking origin ${origin} against ${JSON.stringify(allowedOrigins)}`);
        
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          console.log(`✅ CORS: Allowing origin ${origin}`);
          callback(null, true);
        } else {
          console.warn(`❌ CORS: Blocked origin ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    // Rate limiting - skip for health checks and be very lenient in development
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
      legacyHeaders: false,
      skip: (req) => {
        // Skip rate limiting for health checks
        if (req.path === '/api/v1/health' || req.path === '/health') {
          return true;
        }
        // Skip rate limiting for OPTIONS requests (CORS preflight)
        if (req.method === 'OPTIONS') {
          return true;
        }
        // In development, completely disable rate limiting
        if (config.nodeEnv === 'development') {
          return true; // Skip rate limiting for ALL routes in development
        }
        return false;
      }
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Static file serving for uploads
    // Files are saved to process.cwd()/uploads/chat, so serve from process.cwd()/uploads
    // Add CORS headers for static files
    this.app.use('/uploads', (req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = Array.isArray(config.cors.origin) 
        ? config.cors.origin 
        : [config.cors.origin];
      
      if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      // Handle OPTIONS preflight
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      next();
    });
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

      // Initialize ChatService first (needed by SocketHandler and ChatController)
      const ChatService = (await import('./services/chatService.js')).default;
      const chatService = new ChatService(this.io);
      
      // Initialize ChatController and inject ChatService
      const chatController = (await import('./controllers/chat/chatController.js')).default;
      chatController.setChatService(chatService);
      console.log('💬 ChatService initialized');

      // Initialize Socket.io handler (will use ChatService internally)
      this.socketHandler = new SocketHandler(this.io);
      console.log('🔌 Socket.io initialized');

      // Start server
      this.server.listen(config.port, config.host, () => {
        console.log(`🚀 Auth Service running on ${config.host}:${config.port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🔌 Socket.io enabled for real-time features`);
        console.log(`🔗 API Documentation: http://${config.host}:${config.port}/api/v1/docs`);
        console.log(`❤️  Health Check: http://${config.host}:${config.port}/api/v1/health`);
        
        // Start session cleanup job
        sessionCleanupJob.start();
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        this.server.close(() => {
          console.log('Process terminated');
          database.disconnect();
        });
      });

      process.on('SIGINT', () => {
        console.log('SIGINT received. Shutting down gracefully...');
        this.server.close(() => {
          console.log('Process terminated');
          database.disconnect();
        });
      });

      return this.server;
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

  /**
   * Get Socket.io instance
   */
  getIO() {
    return this.io;
  }
}

// Create and start application
const app = new Application();

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.start();
}

export default app;
