import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../../config/config.js';
import UserRepository from '../../repositories/implementations/UserRepository.js';

/**
 * Session Management Service
 * Handles user sessions, device tracking, and concurrent session control
 */
class SessionService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Extract device information from request
   * @param {Object} req - Express request object
   * @returns {Object} Device information
   */
  extractDeviceInfo(req) {
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Parse user agent for device type and browser info
    const deviceInfo = this.parseUserAgent(userAgent);
    
    return {
      userAgent,
      ipAddress,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os
    };
  }

  /**
   * Parse user agent string to extract device information
   * @param {string} userAgent - User agent string
   * @returns {Object} Parsed device information
   */
  parseUserAgent(userAgent) {
    const ua = userAgent.toLowerCase();
    
    // Detect device type
    let deviceType = 'unknown';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    } else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
      deviceType = 'desktop';
    }

    // Detect browser
    let browser = 'unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    // Detect OS
    let os = 'unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { deviceType, browser, os };
  }

  /**
   * Create a new session for user
   * @param {string} userId - User ID
   * @param {Object} req - Express request object
   * @param {Object} location - Location information (optional)
   * @returns {Promise<Object>} Session data
   */
  async createSession(userId, req, location = {}) {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Clean expired sessions first
    user.cleanExpiredSessions();

    // Check if user has exceeded max concurrent sessions
    if (user.hasExceededMaxSessions()) {
      // Deactivate oldest session
      const oldestSession = user.getOldestActiveSession();
      if (oldestSession) {
        user.deactivateSession(oldestSession.sessionId);
      }
    }

    // Generate new session
    const sessionId = this.generateSessionId();
    const deviceInfo = this.extractDeviceInfo(req);
    
    const sessionData = {
      sessionId,
      deviceInfo,
      location: {
        country: location.country || 'Unknown',
        city: location.city || 'Unknown',
        timezone: location.timezone || 'UTC'
      }
    };

    // Create session
    const session = user.createSession(sessionData);
    await user.save();

    // Generate JWT token with session ID
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      sessionId: sessionId
    };

    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    return {
      sessionId,
      accessToken,
      refreshToken,
      deviceInfo: session.deviceInfo,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Validate session and update activity
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Session validity
   */
  async validateSession(userId, sessionId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return false;
    }

    // Check if session exists and is active
    const session = user.findActiveSession(sessionId);
    if (!session) {
      return false;
    }

    // Check if session is timed out
    if (user.isSessionTimedOut(sessionId)) {
      user.deactivateSession(sessionId);
      await user.save();
      return false;
    }

    // Update session activity
    user.updateSessionActivity(sessionId);
    await user.save();

    return true;
  }

  /**
   * Deactivate session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async deactivateSession(userId, sessionId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return false;
    }

    const success = user.deactivateSession(sessionId);
    if (success) {
      await user.save();
    }

    return success;
  }

  /**
   * Deactivate all sessions for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deactivateAllSessions(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return false;
    }

    user.deactivateAllSessions();
    await user.save();

    return true;
  }

  /**
   * Get active sessions for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Active sessions
   */
  async getActiveSessions(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return [];
    }

    // Clean expired sessions
    user.cleanExpiredSessions();
    await user.save();

    return user.sessions.filter(session => 
      session.isActive && session.expiresAt > new Date()
    );
  }

  /**
   * Check if user is already logged in from same device
   * @param {string} userId - User ID
   * @param {Object} req - Express request object
   * @returns {Promise<Object|null>} Existing session or null
   */
  async findExistingSession(userId, req) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const deviceInfo = this.extractDeviceInfo(req);
    const userAgent = deviceInfo.userAgent;
    const ipAddress = deviceInfo.ipAddress;

    // Find session with same device info
    const existingSession = user.sessions.find(session => 
      session.isActive && 
      session.expiresAt > new Date() &&
      session.deviceInfo.userAgent === userAgent &&
      session.deviceInfo.ipAddress === ipAddress
    );

    return existingSession;
  }

  /**
   * Clean up expired sessions for all users
   * @returns {Promise<number>} Number of sessions cleaned
   */
  async cleanupExpiredSessions() {
    const users = await this.userRepository.findAll({ limit: 1000 });
    let totalCleaned = 0;

    for (const user of users.users) {
      const cleaned = user.cleanExpiredSessions();
      if (cleaned > 0) {
        await user.save();
        totalCleaned += cleaned;
      }
    }

    return totalCleaned;
  }

  /**
   * Get session statistics
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats() {
    const users = await this.userRepository.findAll({ limit: 1000 });
    let totalSessions = 0;
    let activeSessions = 0;
    let expiredSessions = 0;

    for (const user of users.users) {
      totalSessions += user.sessions.length;
      const now = new Date();
      
      user.sessions.forEach(session => {
        if (session.isActive && session.expiresAt > now) {
          activeSessions++;
        } else {
          expiredSessions++;
        }
      });
    }

    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      totalUsers: users.users.length
    };
  }
}

export default SessionService;
