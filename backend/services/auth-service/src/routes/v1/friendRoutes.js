import express from 'express';
import friendController from '../../controllers/friend/friendController.js';
import authMiddleware from '../../middleware/auth/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Send friend request
router.post('/request', (req, res, next) => {
  console.log('🔵 Friend route hit - /request');
  console.log('🔵 req.user:', req.user ? 'exists' : 'null');
  console.log('🔵 req.userId:', req.userId);
  next();
}, friendController.sendFriendRequest);

// Accept friend request
router.post('/accept', friendController.acceptFriendRequest);

// Reject friend request
router.post('/reject', friendController.rejectFriendRequest);

// Cancel sent friend request
router.post('/cancel', friendController.cancelFriendRequest);

// Block user
router.post('/block', friendController.blockUser);

// Remove connection (unfriend)
router.post('/remove', friendController.removeConnection);

// Get pending friend requests
router.get('/pending', friendController.getPendingRequests);

export default router;

