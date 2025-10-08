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
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = 'Resource not found';
      error = new NotFoundErrorResponse(message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `${field} already exists`;
      error = new ConflictErrorResponse(message);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      error = new ValidationErrorResponse(errors);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error = new AuthErrorResponse('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
      error = new AuthErrorResponse('Token expired');
    }

    // Rate limit error
    if (err.status === 429) {
      error = new RateLimitErrorResponse();
    }

    // Default to server error
    if (!error.statusCode) {
      error = new ServerErrorResponse();
    }

    // Send error response
    res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors || [],
      timestamp: new Date().toISOString(),
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
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
