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
    try {
      console.log('🔵 AuthMiddleware constructor: Creating UserRepository instance');
      this.userRepository = new UserRepository();
      console.log('🔵 AuthMiddleware constructor: UserRepository created successfully');
      console.log('🔵 AuthMiddleware constructor: this.userRepository exists:', !!this.userRepository);
    } catch (error) {
      console.error('🔵 AuthMiddleware constructor: Error creating UserRepository:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticate = async (req, res, next) => {
    try {
      console.log('🔵 Auth middleware: Starting authentication');
      console.log('🔵 Auth middleware: URL:', req.originalUrl);
      console.log('🔵 Auth middleware: Method:', req.method);
      console.log('🔵 Auth middleware: this exists:', !!this);
      console.log('🔵 Auth middleware: this.userRepository exists:', !!this.userRepository);
      
      if (!this || !this.userRepository) {
        console.error('🔵 Auth middleware: this or userRepository is undefined!');
        // Create repository on the fly if needed
        if (!this.userRepository) {
          console.log('🔵 Auth middleware: Creating UserRepository on the fly');
          this.userRepository = new UserRepository();
        }
      }
      
      const authHeader = req.headers.authorization;
      console.log('🔵 Auth middleware: Auth header exists:', !!authHeader);
      console.log('🔵 Auth middleware: Auth header starts with Bearer:', authHeader?.startsWith('Bearer '));
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('🔵 Auth middleware: No valid auth header');
        return res.status(401).json(new AuthErrorResponse('Access token required'));
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('🔵 Auth middleware: Token extracted, length:', token.length);
      
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, config.jwt.secret);
        console.log('🔵 Auth middleware: Token verified, user ID:', decoded.id);
      } catch (verifyError) {
        console.error('🔵 Auth middleware: Token verification failed:', verifyError.name, verifyError.message);
        if (verifyError.name === 'JsonWebTokenError') {
          return res.status(401).json(new AuthErrorResponse('Invalid token'));
        }
        if (verifyError.name === 'TokenExpiredError') {
          return res.status(401).json(new AuthErrorResponse('Token expired'));
        }
        throw verifyError;
      }
      
      // Find user
      console.log('🔵 Auth middleware: Looking up user:', decoded.id);
      console.log('🔵 Auth middleware: decoded object:', JSON.stringify(decoded));
      
      let user;
      try {
        user = await this.userRepository.findById(decoded.id);
      } catch (userError) {
        console.error('🔵 Auth middleware: Error finding user:', userError);
        console.error('🔵 Auth middleware: User error name:', userError?.name);
        console.error('🔵 Auth middleware: User error message:', userError?.message);
        throw userError; // Re-throw to be caught by outer catch
      }
      
      if (!user) {
        console.error('🔵 Auth middleware: User not found:', decoded.id);
        return res.status(401).json(new AuthErrorResponse('User not found'));
      }

      if (!user.isActive) {
        console.error('🔵 Auth middleware: User account deactivated:', decoded.id);
        return res.status(401).json(new AuthErrorResponse('Account is deactivated'));
      }

      // Add user to request object
      req.user = user;
      req.userId = user._id;
      
      console.log('🔵 Auth middleware: User authenticated successfully:', user._id);
      next();
    } catch (error) {
      console.error('🔵 Auth middleware: Unexpected error:', error);
      console.error('🔵 Auth middleware: Error name:', error?.name);
      console.error('🔵 Auth middleware: Error message:', error?.message);
      console.error('🔵 Auth middleware: Error stack:', error?.stack);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json(new AuthErrorResponse('Invalid token'));
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(new AuthErrorResponse('Token expired'));
      }
      
      // Return proper error response
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Authentication failed',
        error: error?.message || 'Unknown authentication error',
        timestamp: new Date().toISOString()
      });
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
        console.log('⚠️ optionalAuth - No auth header');
        return next();
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        console.log('✅ optionalAuth - Token decoded, user ID:', decoded.id);
        const user = await this.userRepository.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
          console.log('✅ optionalAuth - User set in req.user:', user._id);
        } else {
          console.log('⚠️ optionalAuth - User not found or inactive');
        }
      } catch (error) {
        console.log('⚠️ optionalAuth - Token verification failed:', error.message);
        // Ignore token errors for optional auth
      }
      
      next();
    } catch (error) {
      console.log('⚠️ optionalAuth - Error:', error.message);
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
