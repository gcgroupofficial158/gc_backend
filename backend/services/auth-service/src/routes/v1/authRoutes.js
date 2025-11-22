import express from 'express';
import authController from '../../controllers/auth/authController.js';
import authMiddleware from '../../middleware/auth/authMiddleware.js';
import validationMiddleware from '../../middleware/validation/validationMiddleware.js';

const router = express.Router();

/**
 * Public Routes (No authentication required)
 */

// Register new user
router.post('/register',
  validationMiddleware.registerValidation(),
  validationMiddleware.handleValidationErrors,
  authController.register
);

// Login user
router.post('/login',
  validationMiddleware.loginValidation(),
  validationMiddleware.handleValidationErrors,
  authController.login
);

// Google OAuth routes
router.post('/google', authController.googleAuth);
router.post('/google/callback', authController.googleCallback);

// Set password for Google OAuth user
router.post('/set-password', authController.setPasswordForGoogleUser);

// Refresh access token
router.post('/refresh-token',
  validationMiddleware.refreshTokenValidation(),
  validationMiddleware.handleValidationErrors,
  authController.refreshToken
);

// Send email verification
router.post('/send-email-verification',
  validationMiddleware.forgotPasswordValidation(),
  validationMiddleware.handleValidationErrors,
  authController.sendEmailVerification
);

// Verify email address
router.get('/verify-email/:token',
  validationMiddleware.emailVerificationValidation(),
  validationMiddleware.handleValidationErrors,
  authController.verifyEmail
);

// Send password reset email
router.post('/forgot-password',
  validationMiddleware.forgotPasswordValidation(),
  validationMiddleware.handleValidationErrors,
  authController.sendPasswordReset
);

// Reset password with token
router.post('/reset-password',
  validationMiddleware.resetPasswordValidation(),
  validationMiddleware.handleValidationErrors,
  authController.resetPassword
);

// Validate token
router.get('/validate-token',
  authController.validateToken
);

/**
 * Protected Routes (Authentication required)
 */

// Logout user
router.post('/logout',
  authMiddleware.authenticate,
  authController.logout
);

// Get current user profile
router.get('/profile',
  authMiddleware.authenticate,
  authController.getProfile
);

// Update user profile
router.put('/profile',
  authMiddleware.authenticate,
  validationMiddleware.updateProfileValidation(),
  validationMiddleware.handleValidationErrors,
  authController.updateProfile
);

// Change password
router.put('/change-password',
  authMiddleware.authenticate,
  validationMiddleware.changePasswordValidation(),
  validationMiddleware.handleValidationErrors,
  authController.changePassword
);

// Deactivate account
router.delete('/deactivate',
  authMiddleware.authenticate,
  authController.deactivateAccount
);

// Session management routes
router.get('/sessions',
  authMiddleware.authenticate,
  authController.getActiveSessions
);

router.delete('/sessions/:sessionId',
  authMiddleware.authenticate,
  authController.deactivateSession
);

router.delete('/sessions',
  authMiddleware.authenticate,
  authController.deactivateAllSessions
);

router.get('/sessions/stats',
  authMiddleware.authenticate,
  authController.getSessionStats
);

export default router;
