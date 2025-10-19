import UserRepository from '../../repositories/implementations/UserRepository.js';
import IProfileService from '../interfaces/IProfileService.js';
import uploadMiddleware from '../../middleware/upload/uploadMiddleware.js';
import { ProfileUpdateRequest, DocumentUploadRequest } from '../../interfaces/requests/ProfileRequests.js';
import { 
  ProfileResponse, 
  ProfileUpdateResponse, 
  ProfileImageUploadResponse,
  DocumentUploadResponse,
  DocumentDeleteResponse,
  SearchResponse,
  StatisticsResponse,
  NotFoundResponse,
  ValidationErrorResponse,
  ErrorResponse
} from '../../interfaces/responses/ProfileResponses.js';

/**
 * Profile Service Implementation
 * Handles profile business logic operations
 */
export default class ProfileService extends IProfileService {
  constructor() {
    super();
    this.userRepository = new UserRepository();
  }

  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @param {boolean} isOwner - Whether the requester is the owner
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId, isOwner = false) {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundResponse('User profile not found');
      }

      const profileResponse = new ProfileResponse(user);
      
      // Return appropriate profile based on ownership
      return isOwner ? profileResponse.getPrivateProfile() : profileResponse.getPublicProfile();
    } catch (error) {
      if (error instanceof NotFoundResponse) {
        throw error;
      }
      throw new ErrorResponse('Failed to get profile', error.message);
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
      // Validate update data
      const profileUpdateRequest = new ProfileUpdateRequest(updateData);
      const validationErrors = profileUpdateRequest.validate();
      
      if (validationErrors.length > 0) {
        throw new ValidationErrorResponse(validationErrors);
      }

      // Get sanitized data
      const sanitizedData = profileUpdateRequest.getSanitizedData();

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundResponse('User profile not found');
      }

      // Update profile
      const updatedUser = await this.userRepository.updateById(userId, sanitizedData);
      
      if (!updatedUser) {
        throw new ErrorResponse('Failed to update profile');
      }

      return new ProfileUpdateResponse(updatedUser);
    } catch (error) {
      if (error instanceof ValidationErrorResponse || error instanceof NotFoundResponse) {
        throw error;
      }
      throw new ErrorResponse('Failed to update profile', error.message);
    }
  }

  /**
   * Upload profile image
   * @param {string} userId - User ID
   * @param {Object} file - Uploaded file
   * @returns {Promise<Object>} Updated profile with image
   */
  async uploadProfileImage(userId, file) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundResponse('User profile not found');
      }

      // Process the image
      const imageData = await uploadMiddleware.processProfileImage(file.path, file.filename);

      // Update user profile with image data
      const updatedUser = await this.userRepository.updateProfileImage(userId, {
        original: imageData.original,
        thumbnail: imageData.thumbnail
      });

      if (!updatedUser) {
        throw new ErrorResponse('Failed to update profile image');
      }

      return new ProfileImageUploadResponse(updatedUser, imageData);
    } catch (error) {
      // Clean up uploaded file on error
      if (file && file.path) {
        await uploadMiddleware.deleteFile(file.path);
      }
      
      if (error instanceof NotFoundResponse) {
        throw error;
      }
      throw new ErrorResponse('Failed to upload profile image', error.message);
    }
  }

  /**
   * Delete profile image
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated profile
   */
  async deleteProfileImage(userId) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundResponse('User profile not found');
      }

      // Delete image files if they exist
      if (existingUser.profileImage) {
        const uploadPath = process.env.UPLOAD_PATH || './src/uploads';
        
        if (existingUser.profileImage.original?.filename) {
          await uploadMiddleware.deleteFile(`${uploadPath}/images/${existingUser.profileImage.original.filename}`);
        }
        if (existingUser.profileImage.thumbnail?.filename) {
          await uploadMiddleware.deleteFile(`${uploadPath}/images/${existingUser.profileImage.thumbnail.filename}`);
        }
      }

      // Update user profile to remove image
      const updatedUser = await this.userRepository.updateProfileImage(userId, null);

      if (!updatedUser) {
        throw new ErrorResponse('Failed to delete profile image');
      }

      return new ProfileUpdateResponse(updatedUser, 'Profile image deleted successfully');
    } catch (error) {
      if (error instanceof NotFoundResponse) {
        throw error;
      }
      throw new ErrorResponse('Failed to delete profile image', error.message);
    }
  }

  /**
   * Upload document
   * @param {string} userId - User ID
   * @param {Object} file - Uploaded file
   * @param {Object} documentData - Document metadata
   * @returns {Promise<Object>} Updated profile with document
   */
  async uploadDocument(userId, file, documentData) {
    try {
      // Validate document data
      const documentUploadRequest = new DocumentUploadRequest(documentData);
      const validationErrors = documentUploadRequest.validate();
      
      if (validationErrors.length > 0) {
        throw new ValidationErrorResponse(validationErrors);
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundResponse('User profile not found');
      }

      // Process the document
      const processedDocument = await uploadMiddleware.processDocument(
        file.path, 
        file.filename, 
        file.mimetype
      );

      // Prepare document data
      const documentInfo = {
        name: documentUploadRequest.getSanitizedData().name,
        type: documentUploadRequest.getSanitizedData().type,
        file: processedDocument,
        uploadedAt: new Date()
      };

      // Add document to user
      const updatedUser = await this.userRepository.addDocument(userId, documentInfo);

      if (!updatedUser) {
        throw new ErrorResponse('Failed to upload document');
      }

      return new DocumentUploadResponse(updatedUser, documentInfo);
    } catch (error) {
      // Clean up uploaded file on error
      if (file && file.path) {
        await uploadMiddleware.deleteFile(file.path);
      }
      
      if (error instanceof ValidationErrorResponse || error instanceof NotFoundResponse) {
        throw error;
      }
      throw new ErrorResponse('Failed to upload document', error.message);
    }
  }

  /**
   * Delete document
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Updated profile
   */
  async deleteDocument(userId, documentId) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundResponse('User profile not found');
      }

      // Find the document
      const document = existingUser.documents.find(doc => doc._id.toString() === documentId);
      if (!document) {
        throw new NotFoundResponse('Document not found');
      }

      // Delete document file if it exists
      if (document.file?.filename) {
        const uploadPath = process.env.UPLOAD_PATH || './src/uploads';
        await uploadMiddleware.deleteFile(`${uploadPath}/documents/${document.file.filename}`);
      }

      // Remove document from user
      const updatedUser = await this.userRepository.removeDocument(userId, documentId);

      if (!updatedUser) {
        throw new ErrorResponse('Failed to delete document');
      }

      return new DocumentDeleteResponse(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundResponse) {
        throw error;
      }
      throw new ErrorResponse('Failed to delete document', error.message);
    }
  }

  /**
   * Search profiles
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchProfiles(query, options = {}) {
    try {
      const results = await this.userRepository.search(query, options);
      
      return new SearchResponse(results, query, results.length);
    } catch (error) {
      throw new ErrorResponse('Failed to search profiles', error.message);
    }
  }

  /**
   * Get profiles with pagination
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Profiles and pagination info
   */
  async getProfiles(filter = {}, options = {}) {
    try {
      const result = await this.userRepository.findWithPagination(filter, options);
      
      return {
        profiles: result.users.map(user => new ProfileResponse(user).getPublicProfile()),
        pagination: result.pagination
      };
    } catch (error) {
      throw new ErrorResponse('Failed to get profiles', error.message);
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getStatistics() {
    try {
      const stats = await this.userRepository.getStatistics();
      return new StatisticsResponse(stats);
    } catch (error) {
      throw new ErrorResponse('Failed to get statistics', error.message);
    }
  }

  /**
   * Create user profile (when user registers in auth service)
   * @param {Object} userData - User data from auth service
   * @returns {Promise<Object>} Created profile
   */
  async createProfile(userData) {
    try {
      // Check if profile already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ErrorResponse('Profile already exists for this user');
      }

      // Create profile with basic information
      const profileData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role || 'user',
        isActive: userData.isActive !== undefined ? userData.isActive : true
      };

      const createdUser = await this.userRepository.create(profileData);
      return new ProfileResponse(createdUser);
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      throw new ErrorResponse('Failed to create profile', error.message);
    }
  }

  /**
   * Delete user profile
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProfile(userId) {
    try {
      // Get user to clean up files
      const user = await this.userRepository.findById(userId);
      if (user) {
        // Delete profile image files
        if (user.profileImage) {
          const uploadPath = process.env.UPLOAD_PATH || './src/uploads';
          
          if (user.profileImage.original?.filename) {
            await uploadMiddleware.deleteFile(`${uploadPath}/images/${user.profileImage.original.filename}`);
          }
          if (user.profileImage.thumbnail?.filename) {
            await uploadMiddleware.deleteFile(`${uploadPath}/images/${user.profileImage.thumbnail.filename}`);
          }
        }

        // Delete document files
        if (user.documents && user.documents.length > 0) {
          const uploadPath = process.env.UPLOAD_PATH || './src/uploads';
          
          for (const doc of user.documents) {
            if (doc.file?.filename) {
              await uploadMiddleware.deleteFile(`${uploadPath}/documents/${doc.file.filename}`);
            }
          }
        }
      }

      // Delete user profile
      return await this.userRepository.deleteById(userId);
    } catch (error) {
      throw new ErrorResponse('Failed to delete profile', error.message);
    }
  }

  /**
   * Get profiles by occupation
   * @param {string} occupation - Occupation to search
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Profiles with matching occupation
   */
  async getProfilesByOccupation(occupation, options = {}) {
    try {
      const results = await this.userRepository.findByOccupation(occupation, options);
      return results.map(user => new ProfileResponse(user).getPublicProfile());
    } catch (error) {
      throw new ErrorResponse('Failed to get profiles by occupation', error.message);
    }
  }

  /**
   * Get profiles by location
   * @param {string} city - City to search
   * @param {string} country - Country to search
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Profiles in the location
   */
  async getProfilesByLocation(city, country, options = {}) {
    try {
      const results = await this.userRepository.findByLocation(city, country, options);
      return results.map(user => new ProfileResponse(user).getPublicProfile());
    } catch (error) {
      throw new ErrorResponse('Failed to get profiles by location', error.message);
    }
  }
}
