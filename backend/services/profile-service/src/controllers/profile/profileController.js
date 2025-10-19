import ProfileService from '../../services/implementations/ProfileService.js';
import { asyncHandler } from '../../middleware/error/errorMiddleware.js';
import { 
  SuccessResponse, 
  ErrorResponse, 
  NotFoundResponse,
  ValidationErrorResponse 
} from '../../interfaces/responses/ProfileResponses.js';

/**
 * Profile Controller
 * Handles HTTP requests for profile operations
 */
class ProfileController {
  constructor() {
    this.profileService = new ProfileService();
  }

  /**
   * Get user profile
   * GET /api/v1/profiles/:id
   */
  getProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isOwner = req.user && req.user.id === id;
    
    const profile = await this.profileService.getProfile(id, isOwner);
    
    res.status(200).json(new SuccessResponse('Profile retrieved successfully', profile));
  });

  /**
   * Get current user's profile
   * GET /api/v1/profiles/me
   */
  getMyProfile = asyncHandler(async (req, res) => {
    const profile = await this.profileService.getProfile(req.user.id, true);
    
    res.status(200).json(new SuccessResponse('Profile retrieved successfully', profile));
  });

  /**
   * Update user profile
   * PUT /api/v1/profiles/:id
   */
  updateProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const result = await this.profileService.updateProfile(id, updateData);
    
    res.status(200).json(result);
  });

  /**
   * Update current user's profile
   * PUT /api/v1/profiles/me
   */
  updateMyProfile = asyncHandler(async (req, res) => {
    const updateData = req.body;
    
    const result = await this.profileService.updateProfile(req.user.id, updateData);
    
    res.status(200).json(result);
  });

  /**
   * Upload profile image
   * POST /api/v1/profiles/:id/image
   */
  uploadProfileImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json(new ValidationErrorResponse(['Profile image file is required']));
    }
    
    const result = await this.profileService.uploadProfileImage(id, req.file);
    
    res.status(200).json(result);
  });

  /**
   * Upload current user's profile image
   * POST /api/v1/profiles/me/image
   */
  uploadMyProfileImage = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json(new ValidationErrorResponse(['Profile image file is required']));
    }
    
    const result = await this.profileService.uploadProfileImage(req.user.id, req.file);
    
    res.status(200).json(result);
  });

  /**
   * Delete profile image
   * DELETE /api/v1/profiles/:id/image
   */
  deleteProfileImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await this.profileService.deleteProfileImage(id);
    
    res.status(200).json(result);
  });

  /**
   * Delete current user's profile image
   * DELETE /api/v1/profiles/me/image
   */
  deleteMyProfileImage = asyncHandler(async (req, res) => {
    const result = await this.profileService.deleteProfileImage(req.user.id);
    
    res.status(200).json(result);
  });

  /**
   * Upload document
   * POST /api/v1/profiles/:id/documents
   */
  uploadDocument = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const documentData = req.body;
    
    if (!req.file) {
      return res.status(400).json(new ValidationErrorResponse(['Document file is required']));
    }
    
    const result = await this.profileService.uploadDocument(id, req.file, documentData);
    
    res.status(200).json(result);
  });

  /**
   * Upload document to current user's profile
   * POST /api/v1/profiles/me/documents
   */
  uploadMyDocument = asyncHandler(async (req, res) => {
    const documentData = req.body;
    
    if (!req.file) {
      return res.status(400).json(new ValidationErrorResponse(['Document file is required']));
    }
    
    const result = await this.profileService.uploadDocument(req.user.id, req.file, documentData);
    
    res.status(200).json(result);
  });

  /**
   * Delete document
   * DELETE /api/v1/profiles/:id/documents/:documentId
   */
  deleteDocument = asyncHandler(async (req, res) => {
    const { id, documentId } = req.params;
    
    const result = await this.profileService.deleteDocument(id, documentId);
    
    res.status(200).json(result);
  });

  /**
   * Delete document from current user's profile
   * DELETE /api/v1/profiles/me/documents/:documentId
   */
  deleteMyDocument = asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    
    const result = await this.profileService.deleteDocument(req.user.id, documentId);
    
    res.status(200).json(result);
  });

  /**
   * Search profiles
   * GET /api/v1/profiles/search
   */
  searchProfiles = asyncHandler(async (req, res) => {
    const { q: query, limit = 20, page = 1 } = req.query;
    
    if (!query) {
      return res.status(400).json(new ValidationErrorResponse(['Search query is required']));
    }
    
    const options = {
      limit: parseInt(limit),
      page: parseInt(page)
    };
    
    const result = await this.profileService.searchProfiles(query, options);
    
    res.status(200).json(result);
  });

  /**
   * Get profiles with pagination
   * GET /api/v1/profiles
   */
  getProfiles = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'createdAt', 
      order = 'desc',
      occupation,
      city,
      country,
      gender,
      role
    } = req.query;
    
    const filter = {};
    if (occupation) filter.occupation = new RegExp(occupation, 'i');
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (country) filter['address.country'] = new RegExp(country, 'i');
    if (gender) filter.gender = gender;
    if (role) filter.role = role;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sort]: order === 'asc' ? 1 : -1 }
    };
    
    const result = await this.profileService.getProfiles(filter, options);
    
    res.status(200).json(new SuccessResponse('Profiles retrieved successfully', result));
  });

  /**
   * Get profiles by occupation
   * GET /api/v1/profiles/occupation/:occupation
   */
  getProfilesByOccupation = asyncHandler(async (req, res) => {
    const { occupation } = req.params;
    const { limit = 20 } = req.query;
    
    const options = {
      limit: parseInt(limit)
    };
    
    const profiles = await this.profileService.getProfilesByOccupation(occupation, options);
    
    res.status(200).json(new SuccessResponse('Profiles retrieved successfully', { 
      occupation, 
      profiles,
      count: profiles.length 
    }));
  });

  /**
   * Get profiles by location
   * GET /api/v1/profiles/location
   */
  getProfilesByLocation = asyncHandler(async (req, res) => {
    const { city, country } = req.query;
    const { limit = 20 } = req.query;
    
    if (!city && !country) {
      return res.status(400).json(new ValidationErrorResponse(['City or country is required']));
    }
    
    const options = {
      limit: parseInt(limit)
    };
    
    const profiles = await this.profileService.getProfilesByLocation(city, country, options);
    
    res.status(200).json(new SuccessResponse('Profiles retrieved successfully', { 
      city, 
      country, 
      profiles,
      count: profiles.length 
    }));
  });

  /**
   * Get user statistics
   * GET /api/v1/profiles/statistics
   */
  getStatistics = asyncHandler(async (req, res) => {
    const result = await this.profileService.getStatistics();
    
    res.status(200).json(result);
  });

  /**
   * Create user profile (webhook from auth service)
   * POST /api/v1/profiles/webhook/create
   */
  createProfile = asyncHandler(async (req, res) => {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.firstName || !userData.lastName) {
      return res.status(400).json(new ValidationErrorResponse([
        'Email, firstName, and lastName are required'
      ]));
    }
    
    const result = await this.profileService.createProfile(userData);
    
    res.status(201).json(new SuccessResponse('Profile created successfully', result));
  });

  /**
   * Delete user profile (webhook from auth service)
   * DELETE /api/v1/profiles/webhook/:id
   */
  deleteProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const success = await this.profileService.deleteProfile(id);
    
    if (!success) {
      return res.status(404).json(new NotFoundResponse('Profile not found'));
    }
    
    res.status(200).json(new SuccessResponse('Profile deleted successfully'));
  });

  /**
   * Health check
   * GET /api/v1/profiles/health
   */
  healthCheck = asyncHandler(async (req, res) => {
    res.status(200).json(new SuccessResponse('Profile service is healthy', {
      service: 'Profile Service',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  });
}

export default new ProfileController();
