import Friend from '../../models/Friend.js';
import User from '../../models/User.js';
import { asyncHandler } from '../../middleware/error/errorMiddleware.js';
import mongoose from 'mongoose';

/**
 * Friend Controller
 * Handles friend request-related HTTP requests
 */
class FriendController {
  /**
   * Send friend request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  sendFriendRequest = asyncHandler(async (req, res) => {
    try {
      const currentUserId = req.user?._id || req.userId;
      const { userId } = req.body;

      console.log('📤 sendFriendRequest - START');
      console.log('📤 sendFriendRequest - currentUserId:', currentUserId);
      console.log('📤 sendFriendRequest - userId from body:', userId);
      console.log('📤 sendFriendRequest - req.user:', req.user ? 'exists' : 'null');
      console.log('📤 sendFriendRequest - req.body:', JSON.stringify(req.body));

      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'User ID is required',
          timestamp: new Date().toISOString()
        });
      }

      // Convert to ObjectId for MongoDB queries
      const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
        ? new mongoose.Types.ObjectId(String(currentUserId))
        : currentUserId;
      const userIdObj = mongoose.Types.ObjectId.isValid(String(userId))
        ? new mongoose.Types.ObjectId(String(userId))
        : userId;

      // Prevent self-friending
      if (String(currentUserIdObj) === String(userIdObj)) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: 'Cannot send friend request to yourself',
          timestamp: new Date().toISOString()
        });
      }

      // Check if user exists
      let targetUser;
      try {
        targetUser = await User.findById(userIdObj);
        if (!targetUser) {
          return res.status(404).json({
            success: false,
            statusCode: 404,
            message: 'User not found',
            timestamp: new Date().toISOString()
          });
        }
      } catch (userError) {
        console.error('❌ Error finding target user:', userError);
        return res.status(500).json({
          success: false,
          statusCode: 500,
          message: 'Error finding user',
          timestamp: new Date().toISOString()
        });
      }

      // Check if request already exists
      let existingRequest;
      try {
        existingRequest = await Friend.findOne({
          $or: [
            { requester: currentUserIdObj, recipient: userIdObj },
            { requester: userIdObj, recipient: currentUserIdObj }
          ]
        });
      } catch (findError) {
        console.error('❌ Error finding existing request:', findError);
        return res.status(500).json({
          success: false,
          statusCode: 500,
          message: 'Error checking existing friend request',
          timestamp: new Date().toISOString()
        });
      }

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          // If request already exists and is pending, return success (idempotent)
          await existingRequest.populate([
            { path: 'requester', select: 'firstName lastName email profilePicture' },
            { path: 'recipient', select: 'firstName lastName email profilePicture' }
          ]);
          
          const responseRequest = {
            _id: String(existingRequest._id),
            status: existingRequest.status,
            createdAt: existingRequest.createdAt,
            requester: existingRequest.requester?._id ? {
              _id: String(existingRequest.requester._id),
              firstName: existingRequest.requester.firstName || '',
              lastName: existingRequest.requester.lastName || '',
              email: existingRequest.requester.email || '',
              profilePicture: existingRequest.requester.profilePicture || ''
            } : String(existingRequest.requester),
            recipient: existingRequest.recipient?._id ? {
              _id: String(existingRequest.recipient._id),
              firstName: existingRequest.recipient.firstName || '',
              lastName: existingRequest.recipient.lastName || '',
              email: existingRequest.recipient.email || '',
              profilePicture: existingRequest.recipient.profilePicture || ''
            } : String(existingRequest.recipient)
          };
          
          return res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Friend request already pending',
            data: { request: responseRequest },
            timestamp: new Date().toISOString()
          });
        }
        if (existingRequest.status === 'accepted') {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Already connected',
            timestamp: new Date().toISOString()
          });
        }
        if (existingRequest.status === 'blocked') {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Cannot send friend request to blocked user',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Create friend request
      let friendRequest;
      try {
        friendRequest = await Friend.create({
          requester: currentUserIdObj,
          recipient: userIdObj,
          status: 'pending'
        });
        console.log('✅ Friend request created:', friendRequest._id);
      } catch (createError) {
        console.error('❌ Error creating friend request:', createError);
        // Check for duplicate key error
        if (createError.code === 11000) {
          return res.status(400).json({
            success: false,
            statusCode: 400,
            message: 'Friend request already exists',
            timestamp: new Date().toISOString()
          });
        }
        throw createError; // Re-throw to be caught by asyncHandler
      }

      // Populate fields - use execPopulate for better error handling
      try {
        await friendRequest.populate([
          { path: 'requester', select: 'firstName lastName email profilePicture' },
          { path: 'recipient', select: 'firstName lastName email profilePicture' }
        ]);
      } catch (populateError) {
        console.error('❌ Error populating friend request:', populateError);
        console.error('❌ Populate error details:', {
          message: populateError?.message,
          name: populateError?.name,
          stack: populateError?.stack
        });
        // Continue - we'll send response without populated fields
      }

      // Check if response already sent
      if (res.headersSent) {
        console.error('❌ Response already sent before formatting');
        return;
      }

      // Format response - simplified and safer
      const responseRequest = {
        _id: String(friendRequest._id),
        status: friendRequest.status,
        createdAt: friendRequest.createdAt
      };

      // Safely handle requester
      try {
        if (friendRequest.requester) {
          if (friendRequest.requester._id || friendRequest.requester.id) {
            // Populated object
            const reqId = friendRequest.requester._id || friendRequest.requester.id;
            responseRequest.requester = {
              _id: String(reqId),
              firstName: friendRequest.requester.firstName || '',
              lastName: friendRequest.requester.lastName || '',
              email: friendRequest.requester.email || '',
              profilePicture: friendRequest.requester.profilePicture || ''
            };
          } else {
            // Just ObjectId
            responseRequest.requester = String(friendRequest.requester);
          }
        }
      } catch (reqError) {
        console.error('❌ Error formatting requester:', reqError);
        responseRequest.requester = String(friendRequest.requester || currentUserIdObj);
      }

      // Safely handle recipient
      try {
        if (friendRequest.recipient) {
          if (friendRequest.recipient._id || friendRequest.recipient.id) {
            // Populated object
            const recId = friendRequest.recipient._id || friendRequest.recipient.id;
            responseRequest.recipient = {
              _id: String(recId),
              firstName: friendRequest.recipient.firstName || '',
              lastName: friendRequest.recipient.lastName || '',
              email: friendRequest.recipient.email || '',
              profilePicture: friendRequest.recipient.profilePicture || ''
            };
          } else {
            // Just ObjectId
            responseRequest.recipient = String(friendRequest.recipient);
          }
        }
      } catch (recError) {
        console.error('❌ Error formatting recipient:', recError);
        responseRequest.recipient = String(friendRequest.recipient || userIdObj);
      }

      // Send response
      console.log('📤 About to send response...');
      console.log('📤 Response data:', JSON.stringify(responseRequest, null, 2));
      
      try {
        if (res.headersSent) {
          console.error('❌ Response already sent before res.json()');
          return;
        }
        
        const responsePayload = {
          success: true,
          statusCode: 201,
          message: 'Friend request sent successfully',
          data: { 
            request: responseRequest
          },
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 Sending response payload:', JSON.stringify(responsePayload, null, 2));
        res.status(201).json(responsePayload);
        console.log('✅ Response sent successfully');
      } catch (sendError) {
        console.error('❌ Error sending response:', sendError);
        console.error('❌ Send error name:', sendError?.name);
        console.error('❌ Send error message:', sendError?.message);
        console.error('❌ Send error stack:', sendError?.stack);
        
        // If we can't send JSON, something is very wrong
        if (!res.headersSent) {
          try {
            const fallbackPayload = {
              success: true,
              statusCode: 201,
              message: 'Friend request sent successfully',
              data: { request: { _id: String(friendRequest._id), status: friendRequest.status } },
              timestamp: new Date().toISOString()
            };
            console.log('📤 Trying fallback response...');
            res.status(201).send(JSON.stringify(fallbackPayload));
            console.log('✅ Fallback response sent');
          } catch (finalError) {
            console.error('❌ Complete failure to send response:', finalError);
            throw sendError;
          }
        } else {
          console.error('❌ Cannot send fallback - headers already sent');
        }
      }
    } catch (outerError) {
      console.error('❌ sendFriendRequest - OUTER CATCH:', outerError);
      console.error('❌ sendFriendRequest - Error name:', outerError?.name);
      console.error('❌ sendFriendRequest - Error message:', outerError?.message);
      console.error('❌ sendFriendRequest - Error stack:', outerError?.stack);
      // Re-throw to be caught by asyncHandler
      throw outerError;
    }
  });

  /**
   * Accept friend request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  acceptFriendRequest = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { userId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;
    const userIdObj = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    // Find pending request
    const friendRequest = await Friend.findOne({
      recipient: currentUserIdObj,
      requester: userIdObj,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Friend request not found',
        timestamp: new Date().toISOString()
      });
    }

    // Accept request
    friendRequest.status = 'accepted';
    friendRequest.acceptedAt = new Date();
    await friendRequest.save();

    await friendRequest.populate('requester', 'firstName lastName email profilePicture');
    await friendRequest.populate('recipient', 'firstName lastName email profilePicture');

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Friend request accepted',
      data: { request: friendRequest },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Reject friend request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  rejectFriendRequest = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { userId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;
    const userIdObj = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    // Delete pending request (idempotent - if already deleted, treat as success)
    const friendRequest = await Friend.findOneAndDelete({
      recipient: currentUserIdObj,
      requester: userIdObj,
      status: 'pending'
    });

    // If request doesn't exist, it's already been processed - treat as success
    if (!friendRequest) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Friend request already processed or not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Friend request rejected',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Cancel sent friend request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  cancelFriendRequest = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { userId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;
    const userIdObj = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    // Delete pending request where current user is the requester (idempotent)
    const friendRequest = await Friend.findOneAndDelete({
      requester: currentUserIdObj,
      recipient: userIdObj,
      status: 'pending'
    });

    // If request doesn't exist, it's already been processed - treat as success
    if (!friendRequest) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Friend request already processed or not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Friend request cancelled',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Block user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  blockUser = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { userId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;
    const userIdObj = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    // Find or create blocked relationship
    let friendRequest = await Friend.findOne({
      $or: [
        { requester: currentUserIdObj, recipient: userIdObj },
        { requester: userIdObj, recipient: currentUserIdObj }
      ]
    });

    if (friendRequest) {
      friendRequest.status = 'blocked';
      await friendRequest.save();
    } else {
      friendRequest = await Friend.create({
        requester: currentUserIdObj,
        recipient: userIdObj,
        status: 'blocked'
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User blocked successfully',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get pending friend requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPendingRequests = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;

    // Get received requests (pending)
    const receivedRequests = await Friend.find({
      recipient: currentUserIdObj,
      status: 'pending'
    }).populate('requester', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 });

    // Get sent requests (pending)
    const sentRequests = await Friend.find({
      requester: currentUserIdObj,
      status: 'pending'
    }).populate('recipient', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Pending requests retrieved successfully',
      data: {
        received: receivedRequests.map(req => ({
          _id: req._id,
          user: req.requester,
          status: req.status,
          createdAt: req.createdAt
        })),
        sent: sentRequests.map(req => ({
          _id: req._id,
          user: req.recipient,
          status: req.status,
          createdAt: req.createdAt
        }))
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Remove connection (unfriend)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  removeConnection = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { userId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;
    const userIdObj = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    // Delete accepted friendship
    const friendRequest = await Friend.findOneAndDelete({
      $or: [
        { requester: currentUserIdObj, recipient: userIdObj, status: 'accepted' },
        { requester: userIdObj, recipient: currentUserIdObj, status: 'accepted' }
      ]
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Connection not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Connection removed successfully',
      timestamp: new Date().toISOString()
    });
  });
}

export default new FriendController();

