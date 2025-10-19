import User from '../../models/User.js';
import IUserRepository from '../interfaces/IUserRepository.js';

/**
 * User Repository Implementation
 * MongoDB implementation of user data operations
 */
export default class UserRepository extends IUserRepository {
  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  async findById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateById(id, updateData) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteById(id) {
    try {
      const result = await User.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Find users with pagination
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Users and pagination info
   */
  async findWithPagination(filter = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        select = '-__v'
      } = options;

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select(select)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(filter)
      ]);

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to find users with pagination: ${error.message}`);
    }
  }

  /**
   * Search users
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async search(query, options = {}) {
    try {
      const {
        limit = 20,
        select = 'firstName lastName email profileImage occupation company'
      } = options;

      const searchRegex = new RegExp(query, 'i');
      
      const searchFields = [
        'firstName',
        'lastName',
        'email',
        'bio',
        'occupation',
        'company',
        'address.city',
        'address.country'
      ];

      const searchQuery = {
        $or: searchFields.map(field => ({
          [field]: searchRegex
        }))
      };

      return await User.find(searchQuery)
        .select(select)
        .limit(limit)
        .lean();
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  /**
   * Update profile image
   * @param {string} id - User ID
   * @param {Object} imageData - Image data
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateProfileImage(id, imageData) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $set: { profileImage: imageData } },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to update profile image: ${error.message}`);
    }
  }

  /**
   * Add document to user
   * @param {string} id - User ID
   * @param {Object} documentData - Document data
   * @returns {Promise<Object|null>} Updated user or null
   */
  async addDocument(id, documentData) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $push: { documents: documentData } },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to add document: ${error.message}`);
    }
  }

  /**
   * Remove document from user
   * @param {string} id - User ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object|null>} Updated user or null
   */
  async removeDocument(id, documentId) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $pull: { documents: { _id: documentId } } },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to remove document: ${error.message}`);
    }
  }

  /**
   * Count users
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} User count
   */
  async count(filter = {}) {
    try {
      return await User.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} Exists status
   */
  async emailExists(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return !!user;
    } catch (error) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }
  }

  /**
   * Find users by occupation
   * @param {string} occupation - Occupation to search
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Users with matching occupation
   */
  async findByOccupation(occupation, options = {}) {
    try {
      const { limit = 20, select = 'firstName lastName email profileImage occupation company' } = options;
      
      return await User.find({ occupation: new RegExp(occupation, 'i') })
        .select(select)
        .limit(limit)
        .lean();
    } catch (error) {
      throw new Error(`Failed to find users by occupation: ${error.message}`);
    }
  }

  /**
   * Find users by location
   * @param {string} city - City to search
   * @param {string} country - Country to search
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Users in the location
   */
  async findByLocation(city, country, options = {}) {
    try {
      const { limit = 20, select = 'firstName lastName email profileImage address occupation company' } = options;
      
      const filter = {};
      if (city) filter['address.city'] = new RegExp(city, 'i');
      if (country) filter['address.country'] = new RegExp(country, 'i');
      
      return await User.find(filter)
        .select(select)
        .limit(limit)
        .lean();
    } catch (error) {
      throw new Error(`Failed to find users by location: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getStatistics() {
    try {
      const [
        totalUsers,
        activeUsers,
        usersWithProfileImages,
        usersByGender,
        usersByRole
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ 'profileImage.original.url': { $exists: true } }),
        User.aggregate([
          { $group: { _id: '$gender', count: { $sum: 1 } } }
        ]),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      ]);

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersWithProfileImages,
        usersWithoutProfileImages: totalUsers - usersWithProfileImages,
        genderDistribution: usersByGender,
        roleDistribution: usersByRole
      };
    } catch (error) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }
}
