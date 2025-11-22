import config from '../../config/config.js';
import { 
  ValidationErrorResponse,
  AuthErrorResponse,
  AuthorizationErrorResponse,
  NotFoundErrorResponse,
  ConflictErrorResponse,
  RateLimitErrorResponse,
  ServerErrorResponse
} from '../../interfaces/responses/AuthResponses.js';

/**
 * Error Middleware
 * Handles all application errors and provides consistent error responses
 */
class ErrorMiddleware {
  /**
   * Global error handler
   * @param {Error} err - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  handleError(err, req, res, next) {
    // Check if response has already been sent
    if (res.headersSent) {
      console.error('Response already sent, cannot send error response');
      return next(err);
    }

    // Log error with safe serialization
    try {
      console.error('Error:', {
        message: err?.message || 'Unknown error',
        name: err?.name || 'Error',
        code: err?.code,
        stack: err?.stack || 'No stack trace',
        url: req?.originalUrl || 'Unknown',
        method: req?.method || 'Unknown',
        ip: req?.ip || 'Unknown',
        userAgent: req?.get('User-Agent') || 'Unknown'
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    let statusCode = 500;
    let message = 'Internal server error';
    let errors = [];

    // Mongoose bad ObjectId
    if (err?.name === 'CastError') {
      statusCode = 404;
      message = 'Resource not found';
    }
    // Mongoose duplicate key
    else if (err?.code === 11000) {
      statusCode = 409;
      const field = err?.keyValue ? Object.keys(err.keyValue)[0] : 'field';
      message = `${field} already exists`;
    }
    // Mongoose validation error
    else if (err?.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      errors = err?.errors ? Object.values(err.errors).map(val => val?.message || 'Invalid value') : [];
    }
    // JWT errors
    else if (err?.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    }
    else if (err?.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    }
    // Rate limit error
    else if (err?.status === 429) {
      statusCode = 429;
      message = 'Too many requests, please try again later';
    }
    // Custom error with statusCode
    else if (err?.statusCode) {
      statusCode = err.statusCode;
      message = err?.message || message;
      errors = err?.errors || [];
    }
    // Use error message if available
    else if (err?.message) {
      message = err.message;
    }

    // Build safe response object
    const response = {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString()
    };

    // Add stack trace in development
    if (config.nodeEnv === 'development' && err?.stack) {
      response.stack = err.stack;
    }

    // Send error response with error handling
    try {
      res.status(statusCode).json(response);
    } catch (sendError) {
      console.error('Failed to send error response:', sendError);
      // Last resort - try to send minimal response
      try {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            statusCode: 500,
            message: 'Internal server error',
            timestamp: new Date().toISOString()
          });
        }
      } catch (finalError) {
        console.error('Failed to send final error response:', finalError);
      }
    }
  }

  /**
   * Handle 404 errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  handleNotFound(req, res, next) {
    const error = new NotFoundErrorResponse(`Route ${req.originalUrl} not found`);
    res.status(404).json({
      success: false,
      statusCode: 404,
      message: error.message,
      errors: [],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Async error handler wrapper
   * @param {Function} fn - Async function to wrap
   * @returns {Function} Wrapped function
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

const errorMiddleware = new ErrorMiddleware();

export { errorMiddleware as default, errorMiddleware };
export const { asyncHandler } = errorMiddleware;
