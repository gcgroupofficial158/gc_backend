import mongoose from 'mongoose';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import { asyncHandler } from '../../middleware/error/errorMiddleware.js';

/**
 * Post Controller
 * Handles post-related HTTP requests
 */
class PostController {
  /**
   * Get all posts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllPosts = asyncHandler(async (req, res) => {
    const { type, visibility = 'public', limit = 50, skip = 0, author } = req.query;
    const userId = req.user?.id;

    // Build query
    const query = { isActive: true };
    
    if (type) {
      query.type = type;
    }

    // Filter by author if provided
    if (author) {
      const authorId = mongoose.Types.ObjectId.isValid(author)
        ? new mongoose.Types.ObjectId(author)
        : author;
      query.author = authorId;
    }

    // Visibility filter
    if (visibility === 'public') {
      query.visibility = 'public';
    } else if (visibility === 'connections_only' && userId) {
      // For connections only, we'd need to check friend relationships
      // For now, show public posts
      query.visibility = { $in: ['public', 'connections_only'] };
    }

    const posts = await Post.find(query)
      .populate('author', 'firstName lastName profilePicture email')
      .populate('likes.user', 'firstName lastName profilePicture')
      .populate('dislikes.user', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Format posts
    const formattedPosts = posts.map(post => ({
      _id: post._id,
      author: {
        _id: post.author._id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        fullName: `${post.author.firstName} ${post.author.lastName}`,
        email: post.author.email,
        profilePicture: post.author.profilePicture
      },
      type: post.type,
      content: post.content,
      tags: post.tags,
      visibility: post.visibility,
      likes: post.likes.map(like => ({
        user: {
          _id: like.user._id,
          firstName: like.user.firstName,
          lastName: like.user.lastName,
          profilePicture: like.user.profilePicture
        },
        createdAt: like.createdAt
      })),
      dislikes: post.dislikes.map(dislike => ({
        user: {
          _id: dislike.user._id,
          firstName: dislike.user.firstName,
          lastName: dislike.user.lastName,
          profilePicture: dislike.user.profilePicture
        },
        createdAt: dislike.createdAt
      })),
      likeCount: post.likes.length,
      dislikeCount: post.dislikes.length,
      commentCount: post.comments.length,
      shareCount: post.shares.length,
      isLiked: userId ? post.likes.some(like => like.user._id.toString() === userId) : false,
      isDisliked: userId ? post.dislikes.some(dislike => dislike.user._id.toString() === userId) : false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Posts retrieved successfully',
      data: {
        posts: formattedPosts,
        total: formattedPosts.length
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get single post by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await Post.findById(id)
      .populate('author', 'firstName lastName profilePicture email')
      .populate('likes.user', 'firstName lastName profilePicture')
      .populate('dislikes.user', 'firstName lastName profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'firstName lastName profilePicture'
        }
      });

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Post not found',
        timestamp: new Date().toISOString()
      });
    }

    const formattedPost = {
      _id: post._id,
      author: {
        _id: post.author._id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        fullName: `${post.author.firstName} ${post.author.lastName}`,
        email: post.author.email,
        profilePicture: post.author.profilePicture
      },
      type: post.type,
      content: post.content,
      tags: post.tags,
      visibility: post.visibility,
      likes: post.likes.map(like => ({
        user: {
          _id: like.user._id,
          firstName: like.user.firstName,
          lastName: like.user.lastName,
          profilePicture: like.user.profilePicture
        },
        createdAt: like.createdAt
      })),
      dislikes: post.dislikes.map(dislike => ({
        user: {
          _id: dislike.user._id,
          firstName: dislike.user.firstName,
          lastName: dislike.user.lastName,
          profilePicture: dislike.user.profilePicture
        },
        createdAt: dislike.createdAt
      })),
      likeCount: post.likes.length,
      dislikeCount: post.dislikes.length,
      commentCount: post.comments.length,
      shareCount: post.shares.length,
      isLiked: userId ? post.likes.some(like => like.user._id.toString() === userId) : false,
      isDisliked: userId ? post.dislikes.some(dislike => dislike.user._id.toString() === userId) : false,
      comments: post.comments.map(comment => ({
        _id: comment._id,
        author: {
          _id: comment.author._id,
          firstName: comment.author.firstName,
          lastName: comment.author.lastName,
          profilePicture: comment.author.profilePicture
        },
        content: comment.content,
        likeCount: comment.likes.length,
        createdAt: comment.createdAt
      })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Post retrieved successfully',
      data: { post: formattedPost },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get comments for a post
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPostComments = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const comments = await Comment.find({ post: id, isActive: true })
      .populate('author', 'firstName lastName profilePicture')
      .populate('likes.user', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    const formattedComments = comments.map(comment => ({
      _id: comment._id,
      author: {
        _id: comment.author._id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
        profilePicture: comment.author.profilePicture
      },
      content: comment.content,
      likeCount: comment.likes.length,
      createdAt: comment.createdAt
    }));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Comments retrieved successfully',
      data: { comments: formattedComments },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Update a post
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, tags, visibility } = req.body;

    const post = await Post.findById(id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Post not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Not authorized to update this post',
        timestamp: new Date().toISOString()
      });
    }

    // Update post fields
    if (content !== undefined) {
      post.content = { ...post.content, ...content };
    }
    if (tags !== undefined) {
      post.tags = tags;
    }
    if (visibility !== undefined) {
      post.visibility = visibility;
    }

    await post.save();

    await post.populate('author', 'firstName lastName profilePicture email');
    await post.populate('likes.user', 'firstName lastName profilePicture');
    await post.populate('dislikes.user', 'firstName lastName profilePicture');

    const formattedPost = {
      _id: post._id,
      author: {
        _id: post.author._id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        fullName: `${post.author.firstName} ${post.author.lastName}`,
        profilePicture: post.author.profilePicture
      },
      type: post.type,
      content: post.content,
      tags: post.tags,
      visibility: post.visibility,
      likes: post.likes.map(like => ({
        user: {
          _id: like.user._id,
          firstName: like.user.firstName,
          lastName: like.user.lastName,
          profilePicture: like.user.profilePicture
        },
        createdAt: like.createdAt
      })),
      dislikes: post.dislikes.map(dislike => ({
        user: {
          _id: dislike.user._id,
          firstName: dislike.user.firstName,
          lastName: dislike.user.lastName,
          profilePicture: dislike.user.profilePicture
        },
        createdAt: dislike.createdAt
      })),
      likeCount: post.likes.length,
      dislikeCount: post.dislikes.length,
      commentCount: post.comments.length,
      shareCount: post.shares.length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Post updated successfully',
      data: { post: formattedPost },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Delete a post
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Post not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is the author
    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'Not authorized to delete this post',
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete - set isActive to false
    post.isActive = false;
    await post.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Post deleted successfully',
      timestamp: new Date().toISOString()
    });
  });
}

export default new PostController();

