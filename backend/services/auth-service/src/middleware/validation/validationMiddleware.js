import { body, param, query, validationResult } from 'express-validator';
import { ValidationErrorResponse } from '../../interfaces/responses/AuthResponses.js';

/**
 * Validation Middleware
 * Handles request validation using express-validator
 */
class ValidationMiddleware {
  /**
   * Handle validation errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json(new ValidationErrorResponse(errorMessages));
    }
    
    next();
  }

  /**
   * Register validation rules
   */
  registerValidation() {
    return [
      body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
      
      body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
      
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
      
      body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
      
      body('role')
        .optional()
        .isIn(['user', 'admin', 'moderator'])
        .withMessage('Invalid role specified')
    ];
  }

  /**
   * Login validation rules
   */
  loginValidation() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  /**
   * Refresh token validation rules
   */
  refreshTokenValidation() {
    return [
      body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required')
    ];
  }

  /**
   * Forgot password validation rules
   */
  forgotPasswordValidation() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
    ];
  }

  /**
   * Reset password validation rules
   */
  resetPasswordValidation() {
    return [
      body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
    ];
  }

  /**
   * Change password validation rules
   */
  changePasswordValidation() {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
      
      body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
    ];
  }

  /**
   * Update profile validation rules
   */
  updateProfileValidation() {
    return [
      body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
      
      body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
      
      body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number')
    ];
  }

  /**
   * User ID parameter validation
   */
  userIdValidation() {
    return [
      param('userId')
        .isMongoId()
        .withMessage('Invalid user ID format')
    ];
  }

  /**
   * Pagination validation
   */
  paginationValidation() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      
      query('search')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Search term cannot exceed 100 characters')
    ];
  }

  /**
   * Email verification validation
   */
  emailVerificationValidation() {
    return [
      param('token')
        .notEmpty()
        .withMessage('Verification token is required')
        .isLength({ min: 64, max: 64 })
        .withMessage('Invalid verification token format')
    ];
  }
}

export default new ValidationMiddleware();
