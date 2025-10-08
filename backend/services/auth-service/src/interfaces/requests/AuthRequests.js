/**
 * Authentication Request Interfaces
 * Defines the structure for authentication-related requests
 */

// Register Request
class RegisterRequest {
  constructor(data) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.password = data.password;
    this.phone = data.phone;
    this.role = data.role || 'user';
  }

  validate() {
    const errors = [];
    
    if (!this.firstName || this.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters');
    }
    
    if (!this.lastName || this.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters');
    }
    
    if (!this.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.email)) {
      errors.push('Please provide a valid email address');
    }
    
    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    if (this.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(this.phone)) {
      errors.push('Please provide a valid phone number');
    }
    
    if (this.role && !['user', 'admin', 'moderator'].includes(this.role)) {
      errors.push('Invalid role specified');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Login Request
class LoginRequest {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
    this.rememberMe = data.rememberMe || false;
  }

  validate() {
    const errors = [];
    
    if (!this.email) {
      errors.push('Email is required');
    }
    
    if (!this.password) {
      errors.push('Password is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Refresh Token Request
class RefreshTokenRequest {
  constructor(data) {
    this.refreshToken = data.refreshToken;
  }

  validate() {
    const errors = [];
    
    if (!this.refreshToken) {
      errors.push('Refresh token is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Forgot Password Request
class ForgotPasswordRequest {
  constructor(data) {
    this.email = data.email;
  }

  validate() {
    const errors = [];
    
    if (!this.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(this.email)) {
      errors.push('Please provide a valid email address');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Reset Password Request
class ResetPasswordRequest {
  constructor(data) {
    this.token = data.token;
    this.password = data.password;
  }

  validate() {
    const errors = [];
    
    if (!this.token) {
      errors.push('Reset token is required');
    }
    
    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Change Password Request
class ChangePasswordRequest {
  constructor(data) {
    this.currentPassword = data.currentPassword;
    this.newPassword = data.newPassword;
  }

  validate() {
    const errors = [];
    
    if (!this.currentPassword) {
      errors.push('Current password is required');
    }
    
    if (!this.newPassword || this.newPassword.length < 6) {
      errors.push('New password must be at least 6 characters');
    }
    
    if (this.currentPassword === this.newPassword) {
      errors.push('New password must be different from current password');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest
};
