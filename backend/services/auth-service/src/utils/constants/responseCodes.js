/**
 * Response Status Codes
 * Centralized status codes for consistent API responses
 */
const RESPONSE_CODES = {
  // Success codes
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client error codes
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server error codes
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * Error Messages
 * Centralized error messages for consistent API responses
 */
const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_REQUIRED: 'Access token required',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token has expired',
  ACCOUNT_LOCKED: 'Account is temporarily locked due to too many failed login attempts',
  ACCOUNT_DEACTIVATED: 'Account is deactivated',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  ACCESS_DENIED: 'Access denied',

  // Validation errors
  VALIDATION_FAILED: 'Validation failed',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PASSWORD: 'Password must be at least 6 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_PHONE: 'Please provide a valid phone number',
  INVALID_ROLE: 'Invalid role specified',

  // Resource errors
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  EMAIL_ALREADY_VERIFIED: 'Email already verified',

  // System errors
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
};

/**
 * Success Messages
 * Centralized success messages for consistent API responses
 */
const SUCCESS_MESSAGES = {
  // Authentication messages
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_VERIFICATION_SENT: 'Email verification sent',

  // Profile messages
  PROFILE_RETRIEVED: 'Profile retrieved successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  ACCOUNT_DEACTIVATED: 'Account deactivated successfully',

  // System messages
  SERVICE_RUNNING: 'Auth Service is running',
  HEALTH_CHECK: 'Service is healthy'
};

export {
  RESPONSE_CODES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
