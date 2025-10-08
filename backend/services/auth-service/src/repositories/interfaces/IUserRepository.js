/**
 * User Repository Interface
 * Defines the contract for user data access operations
 */
class IUserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Find user by email with password
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User with password or null
   */
  async findByEmailWithPassword(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users and pagination info
   */
  async findAll(options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateById(id, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find user by email verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmailVerificationToken(token) {
    throw new Error('Method not implemented');
  }

  /**
   * Find user by password reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>} User or null
   */
  async findByPasswordResetToken(token) {
    throw new Error('Method not implemented');
  }

  /**
   * Update user's last login
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateLastLogin(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Add refresh token to user
   * @param {string} id - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>} Updated user or null
   */
  async addRefreshToken(id, token) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove refresh token from user
   * @param {string} id - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>} Updated user or null
   */
  async removeRefreshToken(id, token) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove all refresh tokens from user
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} Updated user or null
   */
  async removeAllRefreshTokens(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} Exists status
   */
  async emailExists(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Count total users
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} Total count
   */
  async count(filter = {}) {
    throw new Error('Method not implemented');
  }
}

export default IUserRepository;
