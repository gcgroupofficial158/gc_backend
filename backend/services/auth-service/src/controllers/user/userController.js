import mongoose from 'mongoose';
import User from '../../models/User.js';
import Friend from '../../models/Friend.js';
import Post from '../../models/Post.js';
import { asyncHandler } from '../../middleware/error/errorMiddleware.js';

/**
 * User Controller
 * Handles user-related HTTP requests
 */
class UserController {
  /**
   * Get all users (excluding current user)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllUsers = asyncHandler(async (req, res) => {
    // Get current user ID from req.user (set by optionalAuth) or req.userId
    let currentUserId = null;
    if (req.user) {
      currentUserId = req.user._id || req.user.id;
    } else if (req.userId) {
      currentUserId = req.userId;
    }
    
    // Debug logging
    console.log('🔍 getAllUsers - req.user:', req.user ? 'exists' : 'null');
    console.log('🔍 getAllUsers - req.userId:', req.userId);
    console.log('🔍 getAllUsers - currentUserId:', currentUserId);
    
    const { search, limit = 50, skip = 0 } = req.query;

    // Build query
    const query = { isActive: true };
    
    // Get blocked users to exclude them
    let excludedUserIds = [];
    if (currentUserId) {
      // Convert to ObjectId if it's a string
      const userIdStr = String(currentUserId);
      const userIdObj = mongoose.Types.ObjectId.isValid(userIdStr) 
        ? new mongoose.Types.ObjectId(userIdStr)
        : userIdStr;
      excludedUserIds.push(userIdObj); // Exclude current user
      console.log('🔍 getAllUsers - Excluding user ID:', userIdStr);

      // Get blocked users
      const blockedRelationships = await Friend.find({
        $or: [
          { requester: userIdObj, status: 'blocked' },
          { recipient: userIdObj, status: 'blocked' }
        ]
      });

      blockedRelationships.forEach(blocked => {
        const blockedId = String(blocked.requester) === userIdStr
          ? String(blocked.recipient)
          : String(blocked.requester);
        if (mongoose.Types.ObjectId.isValid(blockedId)) {
          excludedUserIds.push(new mongoose.Types.ObjectId(blockedId));
        }
      });
    } else {
      console.log('⚠️ getAllUsers - No currentUserId, returning all users');
    }

    // Exclude current user and blocked users
    if (excludedUserIds.length > 0) {
      query._id = excludedUserIds.length === 1 
        ? { $ne: excludedUserIds[0] }
        : { $nin: excludedUserIds };
    }

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('firstName lastName email profilePicture role')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    // Get friend relationships for current user
    let friendsMap = {};
    if (currentUserId) {
      const friendships = await Friend.find({
        $or: [
          { requester: currentUserId, status: 'accepted' },
          { recipient: currentUserId, status: 'accepted' }
        ]
      });

      friendships.forEach(friendship => {
        const friendId = friendship.requester.toString() === currentUserId
          ? friendship.recipient.toString()
          : friendship.requester.toString();
        friendsMap[friendId] = 'accepted';
      });

      // Get pending requests
      const pendingRequests = await Friend.find({
        $or: [
          { requester: currentUserId, status: 'pending' },
          { recipient: currentUserId, status: 'pending' }
        ]
      });

      pendingRequests.forEach(friendship => {
        const friendId = friendship.requester.toString() === currentUserId
          ? friendship.recipient.toString()
          : friendship.requester.toString();
        friendsMap[friendId] = friendship.requester.toString() === currentUserId ? 'pending_sent' : 'pending_received';
      });
    }

    // Format users
    const formattedUsers = users.map(user => {
      const friendStatus = friendsMap[user._id.toString()] || 'none';
      
      // Get post count for user
      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        profilePicture: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}`,
        friendStatus: friendStatus,
        isConnected: friendStatus === 'accepted'
      };
    });

    // Get post counts for each user
    const userIds = formattedUsers.map(u => u._id);
    const postCounts = await Post.aggregate([
      { $match: { author: { $in: userIds }, isActive: true } },
      { $group: { _id: '$author', count: { $sum: 1 } } }
    ]);

    const postCountMap = {};
    postCounts.forEach(pc => {
      postCountMap[pc._id.toString()] = pc.count;
    });

    formattedUsers.forEach(user => {
      user.papersCount = postCountMap[user._id.toString()] || 0;
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Users retrieved successfully',
      data: {
        users: formattedUsers,
        total: formattedUsers.length
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get user's connections (friends)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getConnections = asyncHandler(async (req, res) => {
    // Get current user ID from req.user (set by authenticate middleware) or req.userId
    let currentUserId = null;
    if (req.user) {
      currentUserId = req.user._id || req.user.id;
    } else if (req.userId) {
      currentUserId = req.userId;
    }

    console.log('🔗 getConnections - req.user:', req.user ? 'exists' : 'null');
    console.log('🔗 getConnections - req.userId:', req.userId);
    console.log('🔗 getConnections - currentUserId:', currentUserId);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    // Convert to ObjectId for MongoDB query
    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;

    // Get blocked users to exclude them
    const blockedRelationships = await Friend.find({
      $or: [
        { requester: currentUserIdObj, status: 'blocked' },
        { recipient: currentUserIdObj, status: 'blocked' }
      ]
    });

    const blockedUserIds = new Set();
    blockedRelationships.forEach(blocked => {
      const blockedId = String(blocked.requester) === String(currentUserId)
        ? String(blocked.recipient)
        : String(blocked.requester);
      blockedUserIds.add(blockedId);
    });

    let friendships = [];
    try {
      friendships = await Friend.find({
        $or: [
          { requester: currentUserIdObj, status: 'accepted' },
          { recipient: currentUserIdObj, status: 'accepted' }
        ]
      }).populate('requester', 'firstName lastName email profilePicture')
        .populate('recipient', 'firstName lastName email profilePicture');
      console.log('🔗 getConnections - Found', friendships.length, 'friendships');
    } catch (error) {
      console.error('🔗 getConnections - Error finding friendships:', error);
      friendships = [];
    }

    // Filter out blocked users
    friendships = friendships.filter(friendship => {
      const requesterId = String(friendship.requester?._id || friendship.requester);
      const recipientId = String(friendship.recipient?._id || friendship.recipient);
      return !blockedUserIds.has(requesterId) && !blockedUserIds.has(recipientId);
    });

    const connections = friendships.map(friendship => {
      const requesterId = String(friendship.requester?._id || friendship.requester);
      const currentUserIdStr = String(currentUserId);
      const friend = requesterId === currentUserIdStr
        ? friendship.recipient
        : friendship.requester;
      
      return {
        _id: friend?._id || friend,
        firstName: friend?.firstName || '',
        lastName: friend?.lastName || '',
        fullName: friend ? `${friend.firstName || ''} ${friend.lastName || ''}`.trim() : '',
        email: friend?.email || '',
        profilePicture: friend?.profilePicture || (friend ? `https://ui-avatars.com/api/?name=${encodeURIComponent((friend.firstName || '') + ' ' + (friend.lastName || ''))}` : ''),
        friendStatus: 'accepted',
        isConnected: true
      };
    });

    // Get post counts (only if there are connections)
    if (connections.length > 0) {
      const userIds = connections.map(c => c._id).filter(id => id);
      if (userIds.length > 0) {
        try {
          const postCounts = await Post.aggregate([
            { $match: { author: { $in: userIds }, isActive: true } },
            { $group: { _id: '$author', count: { $sum: 1 } } }
          ]);

          const postCountMap = {};
          postCounts.forEach(pc => {
            postCountMap[pc._id.toString()] = pc.count;
          });

          connections.forEach(conn => {
            conn.papersCount = postCountMap[conn._id?.toString()] || 0;
          });
        } catch (error) {
          console.error('Error getting post counts for connections:', error);
          connections.forEach(conn => {
            conn.papersCount = 0;
          });
        }
      }
    } else {
      // No connections, set papersCount to 0 for all
      connections.forEach(conn => {
        conn.papersCount = 0;
      });
    }

    console.log('🔗 getConnections - Returning', connections.length, 'connections');

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Connections retrieved successfully',
      data: { connections },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get user suggestions (users not connected)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSuggestions = asyncHandler(async (req, res) => {
    // Get current user ID from req.user (set by authenticate middleware) or req.userId
    let currentUserId = null;
    if (req.user) {
      currentUserId = req.user._id || req.user.id;
    } else if (req.userId) {
      currentUserId = req.userId;
    }

    console.log('💡 getSuggestions - req.user:', req.user ? 'exists' : 'null');
    console.log('💡 getSuggestions - req.userId:', req.userId);
    console.log('💡 getSuggestions - currentUserId:', currentUserId);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    // Convert to ObjectId for MongoDB query
    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;

    // Get blocked users to exclude them
    const blockedRelationships = await Friend.find({
      $or: [
        { requester: currentUserIdObj, status: 'blocked' },
        { recipient: currentUserIdObj, status: 'blocked' }
      ]
    });

    const blockedUserIds = new Set();
    blockedRelationships.forEach(blocked => {
      const blockedId = String(blocked.requester) === String(currentUserId)
        ? String(blocked.recipient)
        : String(blocked.requester);
      blockedUserIds.add(blockedId);
    });

    // Get all friend relationships involving current user
    let friendships = [];
    try {
      friendships = await Friend.find({
        $or: [
          { requester: currentUserIdObj },
          { recipient: currentUserIdObj }
        ]
      });
      console.log('💡 getSuggestions - Found', friendships.length, 'friendships');
    } catch (error) {
      console.error('💡 getSuggestions - Error finding friendships:', error);
      friendships = [];
    }

    const connectedUserIds = new Set();
    const currentUserIdStr = String(currentUserId);
    friendships.forEach(friendship => {
      const requesterId = String(friendship.requester?._id || friendship.requester);
      const recipientId = String(friendship.recipient?._id || friendship.recipient);
      if (requesterId === currentUserIdStr) {
        connectedUserIds.add(recipientId);
      } else {
        connectedUserIds.add(requesterId);
      }
    });
    connectedUserIds.add(currentUserIdStr);

    // Add blocked users to excluded list
    blockedUserIds.forEach(id => connectedUserIds.add(id));

    // Convert string IDs to ObjectIds for MongoDB query
    const excludedIds = Array.from(connectedUserIds).map(id => {
      return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
    });

    // Get users not connected and not blocked
    const suggestions = await User.find({
      _id: { $nin: excludedIds },
      isActive: true
    })
      .select('firstName lastName email profilePicture')
      .limit(20)
      .sort({ createdAt: -1 });

    const formattedSuggestions = suggestions.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      profilePicture: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}`,
      friendStatus: 'none',
      isConnected: false
    }));

    // Get post counts (only if there are suggestions)
    if (formattedSuggestions.length > 0) {
      const userIds = formattedSuggestions.map(s => s._id).filter(id => id);
      if (userIds.length > 0) {
        const postCounts = await Post.aggregate([
          { $match: { author: { $in: userIds }, isActive: true } },
          { $group: { _id: '$author', count: { $sum: 1 } } }
        ]);

        const postCountMap = {};
        postCounts.forEach(pc => {
          postCountMap[pc._id.toString()] = pc.count;
        });

        formattedSuggestions.forEach(suggestion => {
          suggestion.papersCount = postCountMap[suggestion._id?.toString()] || 0;
        });
      }
    } else {
      // No suggestions, set papersCount to 0 for all
      formattedSuggestions.forEach(suggestion => {
        suggestion.papersCount = 0;
      });
    }

    console.log('💡 getSuggestions - Returning', formattedSuggestions.length, 'suggestions');

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Suggestions retrieved successfully',
      data: { suggestions: formattedSuggestions },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const userIdObj = mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : id;

    const user = await User.findById(userIdObj)
      .select('firstName lastName email profilePicture role isActive createdAt')
      .lean();

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Get post count
    const postCount = await Post.countDocuments({ author: userIdObj, isActive: true });

    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      profilePicture: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}`,
      role: user.role,
      papersCount: postCount,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User retrieved successfully',
      data: { user: userData },
      timestamp: new Date().toISOString()
    });
  });
}

export default new UserController();

