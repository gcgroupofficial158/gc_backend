import express from 'express';
import profileController from '../../controllers/profile/profileController.js';
import authMiddleware from '../../middleware/auth/authMiddleware.js';
import validationMiddleware from '../../middleware/validation/validationMiddleware.js';
import uploadMiddleware from '../../middleware/upload/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get('/health', profileController.healthCheck);
router.get('/search', 
  validationMiddleware.searchValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.searchProfiles
);
router.get('/occupation/:occupation', 
  validationMiddleware.paginationValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.getProfilesByOccupation
);
router.get('/location', 
  validationMiddleware.filterValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.getProfilesByLocation
);
router.get('/statistics', profileController.getStatistics);

// Protected routes (require authentication)
router.use(authMiddleware.verifyToken);

// Profile management routes
router.get('/me', profileController.getMyProfile);
router.put('/me', 
  validationMiddleware.profileUpdateValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.updateMyProfile
);

// Profile image routes
router.post('/me/image', 
  uploadMiddleware.profileImageUpload(),
  uploadMiddleware.handleUploadError,
  profileController.uploadMyProfileImage
);
router.delete('/me/image', profileController.deleteMyProfileImage);

// Document routes
router.post('/me/documents', 
  uploadMiddleware.documentUpload(),
  uploadMiddleware.handleUploadError,
  validationMiddleware.documentValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.uploadMyDocument
);
router.delete('/me/documents/:documentId', 
  validationMiddleware.documentIdValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.deleteMyDocument
);

// Admin/Moderator routes
router.use(authMiddleware.requireRole(['admin', 'moderator']));

// User profile management (admin only)
router.get('/:id', 
  validationMiddleware.userIdValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.getProfile
);
router.put('/:id', 
  validationMiddleware.userIdValidation(),
  validationMiddleware.profileUpdateValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.updateProfile
);

// User profile image management (admin only)
router.post('/:id/image', 
  validationMiddleware.userIdValidation(),
  validationMiddleware.handleValidationErrors,
  uploadMiddleware.profileImageUpload(),
  uploadMiddleware.handleUploadError,
  profileController.uploadProfileImage
);
router.delete('/:id/image', 
  validationMiddleware.userIdValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.deleteProfileImage
);

// User document management (admin only)
router.post('/:id/documents', 
  validationMiddleware.userIdValidation(),
  validationMiddleware.handleValidationErrors,
  uploadMiddleware.documentUpload(),
  uploadMiddleware.handleUploadError,
  validationMiddleware.documentValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.uploadDocument
);
router.delete('/:id/documents/:documentId', 
  validationMiddleware.userIdValidation(),
  validationMiddleware.documentIdValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.deleteDocument
);

// Webhook routes (for auth service integration)
router.post('/webhook/create', profileController.createProfile);
router.delete('/webhook/:id', 
  validationMiddleware.userIdValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.deleteProfile
);

// Public profile listing (with pagination)
router.get('/', 
  validationMiddleware.paginationValidation(),
  validationMiddleware.filterValidation(),
  validationMiddleware.handleValidationErrors,
  profileController.getProfiles
);

export default router;
