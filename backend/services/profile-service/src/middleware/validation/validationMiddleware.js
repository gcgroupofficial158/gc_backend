import { body, param, query, validationResult } from 'express-validator';

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
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: errorMessages
      });
    }
    
    next();
  }

  /**
   * Profile update validation rules
   */
  profileUpdateValidation() {
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
        .withMessage('Please provide a valid phone number'),
      
      body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
      
      body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
        .withMessage('Gender must be one of: male, female, other, prefer-not-to-say'),
      
      body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
      
      body('address.street')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Street address cannot exceed 100 characters'),
      
      body('address.city')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('City cannot exceed 50 characters'),
      
      body('address.state')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('State cannot exceed 50 characters'),
      
      body('address.country')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Country cannot exceed 50 characters'),
      
      body('address.postalCode')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Postal code cannot exceed 20 characters'),
      
      body('occupation')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Occupation cannot exceed 100 characters'),
      
      body('company')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Company cannot exceed 100 characters'),
      
      body('website')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid website URL'),
      
      body('socialLinks.linkedin')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid LinkedIn profile URL'),
      
      body('socialLinks.twitter')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid Twitter profile URL'),
      
      body('socialLinks.github')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid GitHub profile URL'),
      
      body('socialLinks.instagram')
        .optional()
        .trim()
        .isURL()
        .withMessage('Please provide a valid Instagram profile URL'),
      
      body('preferences.emailNotifications')
        .optional()
        .isBoolean()
        .withMessage('Email notifications must be a boolean value'),
      
      body('preferences.smsNotifications')
        .optional()
        .isBoolean()
        .withMessage('SMS notifications must be a boolean value'),
      
      body('preferences.profileVisibility')
        .optional()
        .isIn(['public', 'private', 'friends-only'])
        .withMessage('Profile visibility must be one of: public, private, friends-only'),
      
      body('preferences.language')
        .optional()
        .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'])
        .withMessage('Invalid language code'),
      
      body('preferences.timezone')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Timezone must be between 1 and 50 characters')
    ];
  }

  /**
   * Document upload validation rules
   */
  documentValidation() {
    return [
      body('name')
        .notEmpty()
        .withMessage('Document name is required')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Document name must be between 1 and 100 characters'),
      
      body('type')
        .notEmpty()
        .withMessage('Document type is required')
        .isIn(['resume', 'certificate', 'portfolio', 'other'])
        .withMessage('Document type must be one of: resume, certificate, portfolio, other')
    ];
  }

  /**
   * User ID parameter validation
   */
  userIdValidation() {
    return [
      param('id')
        .isMongoId()
        .withMessage('Invalid user ID format')
    ];
  }

  /**
   * Document ID parameter validation
   */
  documentIdValidation() {
    return [
      param('documentId')
        .isMongoId()
        .withMessage('Invalid document ID format')
    ];
  }

  /**
   * Search query validation
   */
  searchValidation() {
    return [
      query('q')
        .notEmpty()
        .withMessage('Search query is required')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
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
      
      query('sort')
        .optional()
        .isIn(['firstName', 'lastName', 'email', 'createdAt', 'lastProfileUpdate'])
        .withMessage('Invalid sort field'),
      
      query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be asc or desc')
    ];
  }

  /**
   * Filter validation
   */
  filterValidation() {
    return [
      query('occupation')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Occupation filter must be between 1 and 100 characters'),
      
      query('city')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('City filter must be between 1 and 50 characters'),
      
      query('country')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Country filter must be between 1 and 50 characters'),
      
      query('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
        .withMessage('Invalid gender filter'),
      
      query('role')
        .optional()
        .isIn(['user', 'admin', 'moderator'])
        .withMessage('Invalid role filter')
    ];
  }
}

export default new ValidationMiddleware();
