import User from '../../models/User.js';
import IUserRepository from '../interfaces/IUserRepository.js';

/**
 * User Repository Implementation
 * Implements user data access operations using MongoDB/Mongoose
 */
class UserRepository extends IUserRepository {
  /**
   * Create a new user
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
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  async findById(id) {
    try {
      console.log('🔵 UserRepository.findById: Looking up user with ID:', id);
      console.log('🔵 UserRepository.findById: ID type:', typeof id);
      console.log('🔵 UserRepository.findById: ID value:', String(id));
      
      // Include refreshTokens by default for service logic that may need it; still exclude password
      const user = await User.findById(id).select('-password');
      console.log('🔵 UserRepository.findById: User found:', user ? 'yes' : 'no');
      if (user) {
        console.log('🔵 UserRepository.findById: User ID:', user._id);
        console.log('🔵 UserRepository.findById: User email:', user.email);
      }
      return user;
    } catch (error) {
      console.error('🔵 UserRepository.findById: Error:', error);
      console.error('🔵 UserRepository.findById: Error name:', error?.name);
      console.error('🔵 UserRepository.findById: Error message:', error?.message);
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Find user by ID with password
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User with password or null
   */
  async findByIdWithPassword(id) {
    try {
      return await User.findById(id).select('+password');
    } catch (error) {
      throw new Error(`Failed to find user by ID with password: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    try {
      return await User.findByEmail(email).select('-password -refreshTokens');
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by email with password
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User with password or null
   */
  async findByEmailWithPassword(email) {
    try {
      return await User.findByEmail(email).select('+password');
    } catch (error) {
      throw new Error(`Failed to find user by email with password: ${error.message}`);
    }
  }

  /**
   * Find all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users and pagination info
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        filter = {},
        search = ''
      } = options;

      const query = { ...filter };
      
      // Add search functionality
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
      ]);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to find users: ${error.message}`);
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
      ).select('-password');
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
   * Find user by email verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmailVerificationToken(token) {
    try {
      return await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      }).select('-password');
    } catch (error) {
      throw new Error(`Failed to find user by verification token: ${error.message}`);
    }
  }

  /**
   * Find user by password reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>} User or null
   */
  async findByPasswordResetToken(token) {
    try {
      return await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      }).select('-password');
    } catch (error) {
      throw new Error(`Failed to find user by reset token: ${error.message}`);
    }
  }

  /**
   * Update user's last login
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} Updated user or null
   */
  async updateLastLogin(id) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { lastLogin: new Date() },
        { new: true }
      ).select('-password');
    } catch (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Add refresh token to user
   * @param {string} id - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>} Updated user or null
   */
  async addRefreshToken(id, token) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $push: { refreshTokens: { token } } },
        { new: true }
      ).select('-password');
    } catch (error) {
      throw new Error(`Failed to add refresh token: ${error.message}`);
    }
  }

  /**
   * Remove refresh token from user
   * @param {string} id - User ID
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>} Updated user or null
   */
  async removeRefreshToken(id, token) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $pull: { refreshTokens: { token } } },
        { new: true }
      ).select('-password');
    } catch (error) {
      throw new Error(`Failed to remove refresh token: ${error.message}`);
    }
  }

  /**
   * Remove all refresh tokens from user
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} Updated user or null
   */
  async removeAllRefreshTokens(id) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $set: { refreshTokens: [] } },
        { new: true }
      ).select('-password');
    } catch (error) {
      throw new Error(`Failed to remove all refresh tokens: ${error.message}`);
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
   * Count total users
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} Total count
   */
  async count(filter = {}) {
    try {
      return await User.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }
}

export default UserRepository;
