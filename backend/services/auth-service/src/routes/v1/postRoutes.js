import express from 'express';
import postController from '../../controllers/post/postController.js';
import authMiddleware from '../../middleware/auth/authMiddleware.js';

const router = express.Router();

// Get all posts (public, no auth required for public posts)
router.get('/', postController.getAllPosts);

// Get single post by ID
router.get('/:id', postController.getPostById);

// Get comments for a post
router.get('/:id/comments', postController.getPostComments);

// Update a post (requires authentication)
router.put('/:id', authMiddleware.authenticate, postController.updatePost);

// Delete a post (requires authentication)
router.delete('/:id', authMiddleware.authenticate, postController.deletePost);

export default router;

