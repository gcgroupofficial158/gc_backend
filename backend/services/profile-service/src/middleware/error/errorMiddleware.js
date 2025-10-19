import config from '../../config/config.js';

/**
 * Error Middleware
 * Centralized error handling for the application
 */
class ErrorMiddleware {
  /**
   * Handle 404 errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  notFound(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
  }

  /**
   * Global error handler
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  globalErrorHandler(error, req, res, next) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = Object.values(error.errors).map(val => val.message).join(', ');
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      statusCode = 400;
      const field = Object.keys(error.keyValue)[0];
      message = `${field} already exists`;
    }

    // Mongoose cast error
    if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    }

    if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    }

    // Multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      statusCode = 400;
      message = 'File too large';
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      statusCode = 400;
      message = 'Too many files';
    }

    // Log error in development
    if (config.nodeEnv === 'development') {
      console.error('Error Details:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Send error response
    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error: config.nodeEnv === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }

  /**
   * Async handler wrapper
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Wrapped function
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection() {
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Close server & exit process
      process.exit(1);
    });
  }

  /**
   * Handle uncaught exceptions
   */
  handleUncaughtException() {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }
}

const errorMiddleware = new ErrorMiddleware();

export { errorMiddleware as default, errorMiddleware };
export const { asyncHandler } = errorMiddleware;
