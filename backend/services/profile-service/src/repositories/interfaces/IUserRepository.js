/**
 * User Repository Interface
 * Defines the contract for user data operations
 */
export default class IUserRepository {
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
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
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
   * Find users with pagination
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Users and pagination info
   */
  async findWithPagination(filter = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Search users
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Update profile image
   * @param {string} id - User ID
   * @param {Object} imageData - Image data
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateProfileImage(id, imageData) {
    throw new Error('Method not implemented');
  }

  /**
   * Add document to user
   * @param {string} id - User ID
   * @param {Object} documentData - Document data
   * @returns {Promise<Object|null>} Updated user or null
   */
  async addDocument(id, documentData) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove document from user
   * @param {string} id - User ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object|null>} Updated user or null
   */
  async removeDocument(id, documentId) {
    throw new Error('Method not implemented');
  }

  /**
   * Count users
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} User count
   */
  async count(filter = {}) {
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
}
