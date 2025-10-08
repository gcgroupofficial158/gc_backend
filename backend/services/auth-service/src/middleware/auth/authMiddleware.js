import jwt from 'jsonwebtoken';
import config from '../../config/config.js';
import UserRepository from '../../repositories/implementations/UserRepository.js';
import { AuthErrorResponse, AuthorizationErrorResponse } from '../../interfaces/responses/AuthResponses.js';

/**
 * Authentication Middleware
 * Verifies JWT tokens and authenticates users
 */
class AuthMiddleware {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Verify JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json(new AuthErrorResponse('Access token required'));
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Find user
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        return res.status(401).json(new AuthErrorResponse('User not found'));
      }

      if (!user.isActive) {
        return res.status(401).json(new AuthErrorResponse('Account is deactivated'));
      }

      // Add user to request object
      req.user = user;
      req.userId = user._id;
      
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json(new AuthErrorResponse('Invalid token'));
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(new AuthErrorResponse('Token expired'));
      }
      
      return res.status(500).json(new Error('Authentication failed'));
    }
  }

  /**
   * Optional authentication - doesn't fail if no token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await this.userRepository.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
      
      next();
    } catch (error) {
      next();
    }
  }

  /**
   * Check if user has specific role
   * @param {string|Array} roles - Required role(s)
   * @returns {Function} Middleware function
   */
  authorize(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json(new AuthErrorResponse('Authentication required'));
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json(new AuthorizationErrorResponse('Insufficient permissions'));
      }
      
      next();
    };
  }

  /**
   * Check if user is admin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json(new AuthErrorResponse('Authentication required'));
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json(new AuthorizationErrorResponse('Admin access required'));
    }
    
    next();
  }

  /**
   * Check if user is admin or moderator
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  requireModerator(req, res, next) {
    if (!req.user) {
      return res.status(401).json(new AuthErrorResponse('Authentication required'));
    }

    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json(new AuthorizationErrorResponse('Moderator access required'));
    }
    
    next();
  }

  /**
   * Check if user can access resource (owner or admin)
   * @param {string} userIdParam - Parameter name containing user ID
   * @returns {Function} Middleware function
   */
  requireOwnershipOrAdmin(userIdParam = 'userId') {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json(new AuthErrorResponse('Authentication required'));
      }

      const resourceUserId = req.params[userIdParam];
      const currentUserId = req.user._id.toString();
      
      if (currentUserId !== resourceUserId && req.user.role !== 'admin') {
        return res.status(403).json(new AuthorizationErrorResponse('Access denied'));
      }
      
      next();
    };
  }
}

export default new AuthMiddleware();
