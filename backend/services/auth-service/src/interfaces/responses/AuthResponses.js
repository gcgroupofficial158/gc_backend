/**
 * Authentication Response Interfaces
 * Defines the structure for authentication-related responses
 */

// Success Response
class SuccessResponse {
  constructor(data = null, message = 'Success', statusCode = 200) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp
    };
  }
}

// Error Response
class ErrorResponse {
  constructor(message = 'An error occurred', statusCode = 500, errors = []) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors,
      timestamp: this.timestamp
    };
  }
}

// Auth Success Response
class AuthSuccessResponse extends SuccessResponse {
  constructor(user, tokens, message = 'Authentication successful') {
    super({
      user: user.toJSON ? user.toJSON() : user,
      tokens
    }, message, 200);
  }
}

// Login Response
class LoginResponse extends AuthSuccessResponse {
  constructor(user, accessToken, refreshToken) {
    super(user, {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: '7d'
    }, 'Login successful');
  }
}

// Register Response
class RegisterResponse extends AuthSuccessResponse {
  constructor(user, accessToken, refreshToken) {
    super(user, {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: '7d'
    }, 'Registration successful');
  }
}

// Token Refresh Response
class TokenRefreshResponse extends SuccessResponse {
  constructor(accessToken, refreshToken) {
    super({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: '7d'
    }, 'Token refreshed successfully', 200);
  }
}

// Logout Response
class LogoutResponse extends SuccessResponse {
  constructor() {
    super(null, 'Logout successful', 200);
  }
}

// Password Reset Response
class PasswordResetResponse extends SuccessResponse {
  constructor() {
    super(null, 'Password reset email sent', 200);
  }
}

// Password Change Response
class PasswordChangeResponse extends SuccessResponse {
  constructor() {
    super(null, 'Password changed successfully', 200);
  }
}

// Email Verification Response
class EmailVerificationResponse extends SuccessResponse {
  constructor() {
    super(null, 'Email verification sent', 200);
  }
}

// Validation Error Response
class ValidationErrorResponse extends ErrorResponse {
  constructor(errors, message = 'Validation failed') {
    super(message, 400, errors);
  }
}

// Authentication Error Response
class AuthErrorResponse extends ErrorResponse {
  constructor(message = 'Authentication failed', statusCode = 401) {
    super(message, statusCode);
  }
}

// Authorization Error Response
class AuthorizationErrorResponse extends ErrorResponse {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

// Not Found Error Response
class NotFoundErrorResponse extends ErrorResponse {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

// Conflict Error Response
class ConflictErrorResponse extends ErrorResponse {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

// Rate Limit Error Response
class RateLimitErrorResponse extends ErrorResponse {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

// Server Error Response
class ServerErrorResponse extends ErrorResponse {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

export {
  SuccessResponse,
  ErrorResponse,
  AuthSuccessResponse,
  LoginResponse,
  RegisterResponse,
  TokenRefreshResponse,
  LogoutResponse,
  PasswordResetResponse,
  PasswordChangeResponse,
  EmailVerificationResponse,
  ValidationErrorResponse,
  AuthErrorResponse,
  AuthorizationErrorResponse,
  NotFoundErrorResponse,
  ConflictErrorResponse,
  RateLimitErrorResponse,
  ServerErrorResponse
};
