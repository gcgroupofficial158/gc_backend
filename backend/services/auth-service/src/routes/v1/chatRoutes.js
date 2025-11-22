import express from 'express';
import chatController from '../../controllers/chat/chatController.js';
import authMiddleware from '../../middleware/auth/authMiddleware.js';
import { upload } from '../../services/fileUploadService.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Send a message (with optional file upload)
router.post('/message', upload.single('file'), chatController.sendMessage);

// Get all conversations for current user
router.get('/conversations', chatController.getConversations);

// Get messages for a specific conversation
router.get('/messages/:userId', chatController.getMessages);

// Mark messages as read
router.put('/messages/read/:userId', chatController.markAsRead);

// Delete a message
router.delete('/message/:messageId', chatController.deleteMessage);

// Block/unblock a conversation
router.put('/block/:userId', chatController.blockConversation);

// Search connections/friends for messaging
router.get('/search-connections', chatController.searchConnections);

// Get online status for conversation participants
router.get('/online-status', chatController.getOnlineStatus);

// Add or remove reaction to a message
router.post('/message/:messageId/reaction', chatController.addReaction);

export default router;

