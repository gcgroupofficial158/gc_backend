/**
 * Authentication Service Interface
 * Defines the contract for authentication business logic
 */
class IAuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result with user and tokens
   */
  async register(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Remember user option
   * @returns {Promise<Object>} Login result with user and tokens
   */
  async login(email, password, rememberMe = false) {
    throw new Error('Method not implemented');
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<Object>} Logout result
   */
  async logout(userId, refreshToken) {
    throw new Error('Method not implemented');
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    throw new Error('Method not implemented');
  }

  /**
   * Verify email address
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(token) {
    throw new Error('Method not implemented');
  }

  /**
   * Send email verification
   * @param {string} email - User email
   * @returns {Promise<Object>} Send result
   */
  async sendEmailVerification(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordReset(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Reset result
   */
  async resetPassword(token, newPassword) {
    throw new Error('Method not implemented');
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Change result
   */
  async changePassword(userId, currentPassword, newPassword) {
    throw new Error('Method not implemented');
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(userId, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deactivation result
   */
  async deactivateAccount(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Validate token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Token validation result
   */
  async validateToken(token) {
    throw new Error('Method not implemented');
  }
}

export default IAuthService;
