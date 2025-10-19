/**
 * Profile Service Interface
 * Defines the contract for profile business logic operations
 */
export default class IProfileService {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @param {boolean} isOwner - Whether the requester is the owner
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId, isOwner = false) {
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
   * Upload profile image
   * @param {string} userId - User ID
   * @param {Object} file - Uploaded file
   * @returns {Promise<Object>} Updated profile with image
   */
  async uploadProfileImage(userId, file) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete profile image
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated profile
   */
  async deleteProfileImage(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Upload document
   * @param {string} userId - User ID
   * @param {Object} file - Uploaded file
   * @param {Object} documentData - Document metadata
   * @returns {Promise<Object>} Updated profile with document
   */
  async uploadDocument(userId, file, documentData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete document
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Updated profile
   */
  async deleteDocument(userId, documentId) {
    throw new Error('Method not implemented');
  }

  /**
   * Search profiles
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchProfiles(query, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get profiles with pagination
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Profiles and pagination info
   */
  async getProfiles(filter = {}, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getStatistics() {
    throw new Error('Method not implemented');
  }

  /**
   * Create user profile (when user registers in auth service)
   * @param {Object} userData - User data from auth service
   * @returns {Promise<Object>} Created profile
   */
  async createProfile(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete user profile
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProfile(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get profiles by occupation
   * @param {string} occupation - Occupation to search
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Profiles with matching occupation
   */
  async getProfilesByOccupation(occupation, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get profiles by location
   * @param {string} city - City to search
   * @param {string} country - Country to search
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Profiles in the location
   */
  async getProfilesByLocation(city, country, options = {}) {
    throw new Error('Method not implemented');
  }
}
