import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../config/config.js';
import IAuthService from '../interfaces/IAuthService.js';
import UserRepository from '../../repositories/implementations/UserRepository.js';
import UserEntity from '../../interfaces/entities/UserEntity.js';
import SessionService from './SessionService.js';
import {
  LoginResponse,
  RegisterResponse,
  TokenRefreshResponse,
  LogoutResponse,
  PasswordResetResponse,
  PasswordChangeResponse,
  EmailVerificationResponse,
  AuthErrorResponse,
  ValidationErrorResponse,
  NotFoundErrorResponse
} from '../../interfaces/responses/AuthResponses.js';

/**
 * Authentication Service Implementation
 * Implements authentication business logic
 */
class AuthService extends IAuthService {
  constructor() {
    super();
    this.userRepository = new UserRepository();
    this.sessionService = new SessionService();
  }

  /**
   * Generate JWT tokens
   * @param {Object} payload - Token payload
   * @returns {Object} Access and refresh tokens
   */
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} secret - Secret key
   * @returns {Object} Decoded payload
   */
  verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new AuthErrorResponse('Invalid or expired token');
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result with user and tokens
   */
  async register(userData) {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ValidationErrorResponse(['Email already registered']);
      }

      // Create user
      const user = await this.userRepository.create(userData);
      
      // Generate tokens
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role
      };
      
      const { accessToken, refreshToken } = this.generateTokens(payload);
      
      // Add refresh token to user
      await this.userRepository.addRefreshToken(user._id, refreshToken);
      
      // Create user entity
      const userEntity = new UserEntity(user);
      
      return new RegisterResponse(userEntity, accessToken, refreshToken);
    } catch (error) {
      if (error instanceof ValidationErrorResponse) {
        throw error;
      }
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Remember user option
   * @param {Object} req - Express request object (for session management)
   * @returns {Promise<Object>} Login result with user and tokens
   */
  async login(email, password, rememberMe = false, req = null) {
    try {
      // Find user by email with password field
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            const user = await this.userRepository.findByEmailWithPassword(email);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            if (!user) {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              throw new AuthErrorResponse('Invalid email or password');
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new AuthErrorResponse('Account is temporarily locked due to too many failed login attempts');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new AuthErrorResponse('Account is deactivated');
      }

      // Check if user is Google OAuth user (no password)
      if (user.provider === 'google' && !user.password) {
        throw new AuthErrorResponse('This account was created with Google. Please use "Sign in with Google" or set a password in your profile settings.');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts();
        throw new AuthErrorResponse('Invalid email or password');
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login
      await this.userRepository.updateLastLogin(user._id);

      let sessionData = null;
      let accessToken, refreshToken;

      if (req) {
        // Check for existing session from same device
        const existingSession = await this.sessionService.findExistingSession(user._id, req);
        
        if (existingSession) {
          // User is already logged in from same device
          // Update session activity and return existing session info
          await this.sessionService.validateSession(user._id, existingSession.sessionId);
          
          // Generate new tokens with existing session ID
          const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
            sessionId: existingSession.sessionId
          };
          
          accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
          refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
          
          sessionData = {
            sessionId: existingSession.sessionId,
            deviceInfo: existingSession.deviceInfo,
            isExistingSession: true
          };
        } else {
          // Create new session
          sessionData = await this.sessionService.createSession(user._id, req);
          accessToken = sessionData.accessToken;
          refreshToken = sessionData.refreshToken;
        }
      } else {
        // Fallback for non-session based login
        const payload = {
          id: user._id,
          email: user.email,
          role: user.role
        };
        
        const tokens = this.generateTokens(payload);
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
        
        // Add refresh token to user
        await this.userRepository.addRefreshToken(user._id, refreshToken);
      }
      
      // Create user entity
      const userEntity = new UserEntity(user);
      
      const response = new LoginResponse(userEntity, accessToken, refreshToken);
      
      // Add session data to response if available
      if (sessionData) {
        response.data.session = sessionData;
      }
      
      return response;
    } catch (error) {
      if (error instanceof AuthErrorResponse) {
        throw error;
      }
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   * @param {string} sessionId - Session ID to deactivate (optional)
   * @param {boolean} logoutAll - Whether to logout from all sessions
   * @returns {Promise<Object>} Logout result
   */
  async logout(userId, refreshToken, sessionId = null, logoutAll = false) {
    try {
      // Handle refresh token cleanup
      if (refreshToken) {
        await this.userRepository.removeRefreshToken(userId, refreshToken);
      } else {
        await this.userRepository.removeAllRefreshTokens(userId);
      }

      // Handle session management
      if (logoutAll) {
        // Deactivate all sessions
        await this.sessionService.deactivateAllSessions(userId);
      } else if (sessionId) {
        // Deactivate specific session
        await this.sessionService.deactivateSession(userId, sessionId);
      }
      
      return new LogoutResponse();
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken, config.jwt.refreshSecret);
      
      // Find user
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new AuthErrorResponse('User not found');
      }

      // Check if refresh token exists in user's tokens
      // user returned includes refreshTokens now
      const tokenExists = Array.isArray(user.refreshTokens) && user.refreshTokens.some(t => t.token === refreshToken);
      
      if (!tokenExists) {
        throw new AuthErrorResponse('Invalid refresh token');
      }

      // Generate new tokens
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role
      };
      
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(payload);
      
      // Replace old refresh token with new one
      await this.userRepository.removeRefreshToken(user._id, refreshToken);
      await this.userRepository.addRefreshToken(user._id, newRefreshToken);
      
      return new TokenRefreshResponse(accessToken, newRefreshToken);
    } catch (error) {
      if (error instanceof AuthErrorResponse) {
        throw error;
      }
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Verify email address
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(token) {
    try {
      const user = await this.userRepository.findByEmailVerificationToken(token);
      if (!user) {
        throw new NotFoundErrorResponse('Invalid or expired verification token');
      }

      await this.userRepository.updateById(user._id, {
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined
      });

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      if (error instanceof NotFoundErrorResponse) {
        throw error;
      }
      throw new Error(`Email verification failed: ${error.message}`);
    }
  }

  /**
   * Send email verification
   * @param {string} email - User email
   * @returns {Promise<Object>} Send result
   */
  async sendEmailVerification(email) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundErrorResponse('User not found');
      }

      if (user.isEmailVerified) {
        throw new ValidationErrorResponse(['Email already verified']);
      }

      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.userRepository.updateById(user._id, {
        emailVerificationToken: token,
        emailVerificationExpires: expires
      });

      // TODO: Send email with verification link
      console.log(`Email verification token for ${email}: ${token}`);

      return new EmailVerificationResponse();
    } catch (error) {
      if (error instanceof NotFoundErrorResponse || error instanceof ValidationErrorResponse) {
        throw error;
      }
      throw new Error(`Send email verification failed: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordReset(email) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return new PasswordResetResponse();
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.userRepository.updateById(user._id, {
        passwordResetToken: token,
        passwordResetExpires: expires
      });

      // TODO: Send email with reset link
      console.log(`Password reset token for ${email}: ${token}`);

      return new PasswordResetResponse();
    } catch (error) {
      throw new Error(`Send password reset failed: ${error.message}`);
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Reset result
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await this.userRepository.findByPasswordResetToken(token);
      if (!user) {
        throw new NotFoundErrorResponse('Invalid or expired reset token');
      }

      await this.userRepository.updateById(user._id, {
        password: newPassword,
        passwordResetToken: undefined,
        passwordResetExpires: undefined
      });

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof NotFoundErrorResponse) {
        throw error;
      }
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Change result
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Fetch user by ID including password to verify current password
      const user = await this.userRepository.findByIdWithPassword(userId);
      if (!user) {
        throw new NotFoundErrorResponse('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AuthErrorResponse('Current password is incorrect');
      }

      // Update password
      await this.userRepository.updateById(userId, { password: newPassword });

      return new PasswordChangeResponse();
    } catch (error) {
      if (error instanceof NotFoundErrorResponse || error instanceof AuthErrorResponse) {
        throw error;
      }
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundErrorResponse('User not found');
      }

      const userEntity = new UserEntity(user);
      return userEntity.toJSON();
    } catch (error) {
      if (error instanceof NotFoundErrorResponse) {
        throw error;
      }
      throw new Error(`Get profile failed: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await this.userRepository.updateById(userId, updateData);
      if (!user) {
        throw new NotFoundErrorResponse('User not found');
      }

      const userEntity = new UserEntity(user);
      return userEntity.toJSON();
    } catch (error) {
      if (error instanceof NotFoundErrorResponse) {
        throw error;
      }
      throw new Error(`Update profile failed: ${error.message}`);
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deactivation result
   */
  async deactivateAccount(userId) {
    try {
      await this.userRepository.updateById(userId, { isActive: false });
      await this.userRepository.removeAllRefreshTokens(userId);
      
      return { success: true, message: 'Account deactivated successfully' };
    } catch (error) {
      throw new Error(`Account deactivation failed: ${error.message}`);
    }
  }

  /**
   * Validate token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Token validation result
   */
  async validateToken(token) {
    try {
      const decoded = this.verifyToken(token, config.jwt.secret);
      const user = await this.userRepository.findById(decoded.id);
      
      if (!user || !user.isActive) {
        throw new AuthErrorResponse('Invalid token');
      }

      // If token contains session ID, validate session
      if (decoded.sessionId) {
        const isSessionValid = await this.sessionService.validateSession(decoded.id, decoded.sessionId);
        if (!isSessionValid) {
          throw new AuthErrorResponse('Session expired or invalid');
        }
      }

      return {
        valid: true,
        user: new UserEntity(user).toJSON(),
        sessionId: decoded.sessionId || null
      };
    } catch (error) {
      if (error instanceof AuthErrorResponse) {
        throw error;
      }
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Google OAuth authentication
   * @param {string} idToken - Google ID token
   * @returns {Promise<AuthResponse>} Authentication response
   */
  async googleAuth(idToken) {
    try {
      // Verify Google ID token
      const googleUser = await this.verifyGoogleToken(idToken);
      
      if (!googleUser) {
        throw new AuthErrorResponse(
          'Invalid Google token',
          401,
          'INVALID_TOKEN'
        );
      }

      // Check if user exists
      let user = await this.userRepository.findByEmail(googleUser.email);
      
      if (!user) {
        // Create new user for Google OAuth
        const userData = {
          firstName: googleUser.given_name || 'Google',
          lastName: googleUser.family_name || 'User',
          email: googleUser.email,
          emailVerified: googleUser.email_verified || false,
          provider: 'google',
          googleId: googleUser.sub,
          profilePicture: googleUser.picture
        };
        
        user = await this.userRepository.create(userData);
      } else {
        // Update existing user with Google info if needed
        if (!user.googleId) {
          await this.userRepository.update(user._id, {
            googleId: googleUser.sub,
            provider: 'google',
            profilePicture: googleUser.picture
          });
        }
      }

      // Generate JWT tokens
      const tokens = await this.generateTokens(user._id, user.email);
      
      // Create session
      const sessionData = await this.sessionService.createSession(
        user._id,
        req?.ip || 'unknown',
        req?.get('User-Agent') || 'unknown'
      );

      const response = new AuthResponse(
        true,
        200,
        'Google authentication successful',
        {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            emailVerified: user.emailVerified,
            profilePicture: user.profilePicture,
            provider: user.provider
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
          }
        }
      );

      // Add session data to response
      if (sessionData) {
        response.data.session = sessionData;
      }

      return response;
    } catch (error) {
      if (error instanceof AuthErrorResponse) {
        throw error;
      }
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  /**
   * Google OAuth callback
   * @param {string} code - Authorization code
   * @param {string} state - State parameter
   * @returns {Promise<AuthResponse>} Authentication response
   */
  async googleCallback(code, state) {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      // Get user info from Google
      const googleUser = await this.getGoogleUserInfo(tokens.access_token);
      
      // Check if user exists
      let user = await this.userRepository.findByEmail(googleUser.email);
      
      if (!user) {
        // Create new user
        const userData = {
          firstName: googleUser.given_name || 'Google',
          lastName: googleUser.family_name || 'User',
          email: googleUser.email,
          emailVerified: googleUser.email_verified || false,
          provider: 'google',
          googleId: googleUser.id,
          profilePicture: googleUser.picture
        };
        
        user = await this.userRepository.create(userData);
      }

      // Generate our JWT tokens
      const jwtTokens = await this.generateTokens(user._id, user.email);
      
      // Create session
      const sessionData = await this.sessionService.createSession(
        user._id,
        'unknown', // IP not available in callback
        'unknown'  // User agent not available in callback
      );

      const response = new AuthResponse(
        true,
        200,
        'Google OAuth callback successful',
        {
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            emailVerified: user.emailVerified,
            profilePicture: user.profilePicture,
            provider: user.provider
          },
          tokens: {
            accessToken: jwtTokens.accessToken,
            refreshToken: jwtTokens.refreshToken
          }
        }
      );

      // Add session data to response
      if (sessionData) {
        response.data.session = sessionData;
      }

      return response;
    } catch (error) {
      if (error instanceof AuthErrorResponse) {
        throw error;
      }
      throw new Error(`Google OAuth callback failed: ${error.message}`);
    }
  }

  /**
   * Verify Google ID token
   * @param {string} idToken - Google ID token
   * @returns {Promise<Object|null>} Decoded token payload or null
   */
  async verifyGoogleToken(idToken) {
    try {
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      return payload;
    } catch (error) {
      console.error('Google token verification failed:', error);
      return null;
    }
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code
   * @returns {Promise<Object>} Google tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      
      const { tokens } = await client.getToken(code);
      return tokens;
    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  /**
   * Get user info from Google
   * @param {string} accessToken - Google access token
   * @returns {Promise<Object>} User info
   */
  async getGoogleUserInfo(accessToken) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      const userInfo = await response.json();
      return userInfo;
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  /**
   * Set password for Google OAuth user
   * @param {string} userId - User ID
   * @param {string} password - New password
   * @returns {Promise<Object>} Success response
   */
  async setPasswordForGoogleUser(userId, password) {
    try {
      // Find user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new AuthErrorResponse('User not found');
      }

      // Check if user is Google OAuth user
      if (user.provider !== 'google') {
        throw new AuthErrorResponse('This user is not a Google OAuth user');
      }

      // Update user with password
      await this.userRepository.update(userId, { password });

      return {
        success: true,
        message: 'Password set successfully. You can now login with email and password.',
        statusCode: 200
      };
    } catch (error) {
      if (error instanceof AuthErrorResponse) {
        throw error;
      }
      throw new Error(`Failed to set password: ${error.message}`);
    }
  }
}

export default AuthService;
