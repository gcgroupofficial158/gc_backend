import AuthService from '../../services/implementations/AuthService.js';
import { RegisterRequest, LoginRequest, RefreshTokenRequest } from '../../interfaces/requests/AuthRequests.js';
import { asyncHandler } from '../../middleware/error/errorMiddleware.js';

/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */
class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register = asyncHandler(async (req, res) => {
    const registerRequest = new RegisterRequest(req.body);
    const validation = registerRequest.validate();
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: validation.errors,
        timestamp: new Date().toISOString()
      });
    }

    const result = await this.authService.register(req.body);
    res.status(201).json(result.toJSON());
  });

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login = asyncHandler(async (req, res) => {
    const loginRequest = new LoginRequest(req.body);
    const validation = loginRequest.validate();
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: validation.errors,
        timestamp: new Date().toISOString()
      });
    }

    const { email, password, rememberMe } = req.body;
    const result = await this.authService.login(email, password, rememberMe, req);
    res.status(200).json(result.toJSON());
  });

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await this.authService.logout(req.userId, refreshToken);
    res.status(200).json(result.toJSON());
  });

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  refreshToken = asyncHandler(async (req, res) => {
    const refreshRequest = new RefreshTokenRequest(req.body);
    const validation = refreshRequest.validate();
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: validation.errors,
        timestamp: new Date().toISOString()
      });
    }

    const { refreshToken } = req.body;
    const result = await this.authService.refreshToken(refreshToken);
    res.status(200).json(result.toJSON());
  });

  /**
   * Verify email address
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await this.authService.verifyEmail(token);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Send email verification
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  sendEmailVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await this.authService.sendEmailVerification(email);
    res.status(200).json(result.toJSON());
  });

  /**
   * Send password reset email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  sendPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await this.authService.sendPasswordReset(email);
    res.status(200).json(result.toJSON());
  });

  /**
   * Reset password with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await this.authService.resetPassword(token, password);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await this.authService.changePassword(req.userId, currentPassword, newPassword);
    res.status(200).json(result.toJSON());
  });

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProfile = asyncHandler(async (req, res) => {
    const profile = await this.authService.getProfile(req.userId);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: profile,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProfile = asyncHandler(async (req, res) => {
    const profile = await this.authService.updateProfile(req.userId, req.body);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile updated successfully',
      data: profile,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Deactivate user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deactivateAccount = asyncHandler(async (req, res) => {
    const result = await this.authService.deactivateAccount(req.userId);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Validate token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  validateToken = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.substring(7) : null;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Token required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await this.authService.validateToken(token);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Token is valid',
      data: result,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get active sessions for user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getActiveSessions = asyncHandler(async (req, res) => {
    const sessions = await this.authService.sessionService.getActiveSessions(req.userId);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Active sessions retrieved successfully',
      data: { sessions },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Deactivate specific session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deactivateSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const success = await this.authService.sessionService.deactivateSession(req.userId, sessionId);
    
    if (success) {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Session deactivated successfully',
        data: null,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Session not found',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Deactivate all sessions for user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deactivateAllSessions = asyncHandler(async (req, res) => {
    const success = await this.authService.sessionService.deactivateAllSessions(req.userId);
    
    if (success) {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'All sessions deactivated successfully',
        data: null,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        statusCode: 500,
        message: 'Failed to deactivate sessions',
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Get session statistics (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSessionStats = asyncHandler(async (req, res) => {
    const stats = await this.authService.sessionService.getSessionStats();
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Session statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    });
  });
}

export default new AuthController();
