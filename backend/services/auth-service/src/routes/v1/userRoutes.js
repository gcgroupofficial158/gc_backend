import express from 'express';
import userController from '../../controllers/user/userController.js';
import authMiddleware from '../../middleware/auth/authMiddleware.js';

const router = express.Router();

// Get all users (optional auth - if authenticated, excludes current user and shows friend status)
router.get('/', authMiddleware.optionalAuth, userController.getAllUsers);

// Get user's connections (requires auth) - MUST come before /:id
router.get('/connections', authMiddleware.authenticate, userController.getConnections);

// Get user suggestions (requires auth) - MUST come before /:id
router.get('/suggestions', authMiddleware.authenticate, userController.getSuggestions);

// Get user by ID (optional auth) - MUST come last to avoid matching /connections or /suggestions
router.get('/:id', authMiddleware.optionalAuth, userController.getUserById);

export default router;

