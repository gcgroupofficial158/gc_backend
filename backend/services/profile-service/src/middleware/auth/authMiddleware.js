import jwt from 'jsonwebtoken';
import config from '../../config/config.js';

/**
 * Authentication Middleware
 * Handles JWT token validation and user authentication
 */
class AuthMiddleware {
  /**
   * Verify JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Access token required',
          error: 'No authorization header provided'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Access token required',
          error: 'No token provided'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId
      };

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Invalid token',
          error: 'Token is malformed or invalid'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Token expired',
          error: 'Please refresh your token'
        });
      }

      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Token verification failed',
        error: error.message
      });
    }
  }

  /**
   * Check if user has required role
   * @param {Array} roles - Allowed roles
   * @returns {Function} Middleware function
   */
  requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Authentication required',
          error: 'User not authenticated'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message: 'Insufficient permissions',
          error: `Required roles: ${roles.join(', ')}`
        });
      }

      next();
    };
  }

  /**
   * Check if user can access resource
   * @param {string} resourceId - Resource ID parameter name
   * @returns {Function} Middleware function
   */
  requireOwnershipOrAdmin(resourceId = 'id') {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Authentication required',
          error: 'User not authenticated'
        });
      }

      const targetId = req.params[resourceId];
      
      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // User can only access their own resource
      if (req.user.id === targetId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Access denied',
        error: 'You can only access your own resources'
      });
    };
  }

  /**
   * Optional authentication middleware
   * Sets user info if token is valid, but doesn't require it
   */
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      
      if (!token) {
        return next();
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId
      };

      next();
    } catch (error) {
      // If token is invalid, continue without user info
      next();
    }
  }

  /**
   * Validate token with auth service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async validateWithAuthService(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Access token required',
          error: 'No authorization header provided'
        });
      }

      const token = authHeader.substring(7);
      
      // Make request to auth service to validate token
      const response = await fetch(`${config.authService.url}${config.authService.validateTokenEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Invalid token',
          error: 'Token validation failed'
        });
      }

      const userData = await response.json();
      req.user = userData.data.user;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Token validation failed',
        error: 'Unable to validate token with auth service'
      });
    }
  }
}

export default new AuthMiddleware();
