import { Message, Conversation } from '../../models/Chat.js';
import User from '../../models/User.js';
import Friend from '../../models/Friend.js';
import UserPresence from '../../models/UserPresence.js';
import { asyncHandler } from '../../middleware/error/errorMiddleware.js';
import mongoose from 'mongoose';
import { getFileType, getFileUrl } from '../../services/fileUploadService.js';
import ChatService from '../../services/chatService.js';

/**
 * Chat Controller
 * Handles chat-related HTTP requests
 */
class ChatController {
  constructor() {
    this.chatService = null;
  }

  setChatService(chatService) {
    this.chatService = chatService;
  }

  /**
   * Send a message
   * POST /api/v1/chat/message
   */
  sendMessage = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { receiverId, content, messageType = 'text', replyTo } = req.body;
    const file = req.file; // File from multer

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Receiver ID is required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate message content
    if (!content && !file) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Message content or attachment is required',
        timestamp: new Date().toISOString()
      });
    }

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;
    const receiverIdObj = mongoose.Types.ObjectId.isValid(String(receiverId))
      ? new mongoose.Types.ObjectId(String(receiverId))
      : receiverId;

    // Check if users are friends (not blocked) OR have past chat history
    // Optimize: Check friendship and conversation in parallel
    const [friendship, conversation] = await Promise.all([
      Friend.findOne({
      $or: [
        { requester: currentUserIdObj, recipient: receiverIdObj },
        { requester: receiverIdObj, recipient: currentUserIdObj }
      ],
      status: { $ne: 'blocked' }
      }),
      Conversation.findOne({
        participants: { $all: [currentUserIdObj, receiverIdObj] }
      })
    ]);

    // Allow messaging if: (1) users are connected friends OR (2) they have past chat history
    const canMessage = (friendship && friendship.status === 'accepted') || conversation;

    if (!canMessage) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'You can only message connections or users with past chat history',
        timestamp: new Date().toISOString()
      });
    }

    // Check if conversation is blocked
    if (conversation && conversation.isBlocked) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'This conversation is blocked',
        timestamp: new Date().toISOString()
      });
    }

    // Create or update conversation
    let conv = conversation;
    if (!conv) {
      conv = await Conversation.create({
        participants: [currentUserIdObj, receiverIdObj],
        unreadCount: new Map([[String(receiverIdObj), 0]])
      });
    }

    // Prepare attachment data if file is provided
    let attachmentData = null;
    let finalMessageType = messageType;
    
    if (file) {
      finalMessageType = getFileType(file.mimetype);
      attachmentData = {
        url: getFileUrl(file.filename),
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      };
    }

    // Use ChatService to send message (handles socket events)
    let message;
    if (this.chatService) {
      message = await this.chatService.sendMessage({
        senderId: currentUserIdObj,
        receiverId: receiverIdObj,
        content: content || '',
        messageType: finalMessageType,
        attachment: attachmentData,
        replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : null
      });
    } else {
      // Fallback: create message without socket events (shouldn't happen in production)
      message = await Message.create({
      sender: currentUserIdObj,
      receiver: receiverIdObj,
      content: content || '',
      messageType: finalMessageType,
      attachment: attachmentData,
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : null
    });

    // Update conversation
    conv.lastMessage = message._id;
    conv.lastMessageAt = new Date();
    const receiverIdStr = String(receiverIdObj);
    const currentUnread = conv.unreadCount.get(receiverIdStr) || 0;
    conv.unreadCount.set(receiverIdStr, currentUnread + 1);
    await conv.save();

      // Populate message
    await message.populate([
      { path: 'sender', select: 'firstName lastName email profilePicture' },
      { path: 'receiver', select: 'firstName lastName email profilePicture' },
      { path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'firstName lastName' } }
    ]);
    }

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Message sent successfully',
      data: { message },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get conversations for current user
   * GET /api/v1/chat/conversations
   */
  getConversations = asyncHandler(async (req, res) => {
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

    const conversations = await Conversation.find({
      participants: currentUserIdObj,
      isBlocked: false
    })
      .populate({
        path: 'participants',
        select: 'firstName lastName email profilePicture',
        match: { _id: { $ne: currentUserIdObj } }
      })
      .populate({
        path: 'lastMessage',
        populate: [
          { path: 'sender', select: 'firstName lastName profilePicture' },
          { path: 'receiver', select: 'firstName lastName profilePicture' }
        ]
      })
      .sort({ lastMessageAt: -1 })
      .limit(50);

    // Format response
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => String(p._id) !== String(currentUserId)
      );
      const unreadCount = conv.unreadCount.get(String(currentUserId)) || 0;

      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        isPinned: conv.isPinned.get(String(currentUserId)) || false,
        isArchived: conv.isArchived.get(String(currentUserId)) || false,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Conversations retrieved successfully',
      data: { conversations: formattedConversations },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get messages for a conversation
   * GET /api/v1/chat/messages/:userId
   */
  getMessages = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

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

    // Get messages
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.find({
      $or: [
        { sender: currentUserIdObj, receiver: userIdObj },
        { sender: userIdObj, receiver: currentUserIdObj }
      ],
      isDeleted: false
    })
      .populate('sender', 'firstName lastName email profilePicture')
      .populate('receiver', 'firstName lastName email profilePicture')
      .populate({
        path: 'replyTo',
        select: 'content sender',
        populate: { path: 'sender', select: 'firstName lastName' }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userIdObj,
        receiver: currentUserIdObj,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserIdObj, userIdObj] }
    });

    if (conversation) {
      conversation.unreadCount.set(String(currentUserId), 0);
      await conversation.save();
    }

    // Reverse to show oldest first
    messages.reverse();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Messages retrieved successfully',
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.length
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Mark messages as read
   * PUT /api/v1/chat/messages/read/:userId
   */
  markAsRead = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { userId } = req.params;

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
    const userIdObj = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userIdObj,
        receiver: currentUserIdObj,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserIdObj, userIdObj] }
    });

    if (conversation) {
      conversation.unreadCount.set(String(currentUserId), 0);
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Messages marked as read',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Delete a message
   * DELETE /api/v1/chat/message/:messageId
   */
  deleteMessage = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { messageId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Message not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is sender or receiver
    const isSender = String(message.sender) === String(currentUserId);
    const isReceiver = String(message.receiver) === String(currentUserId);

    if (!isSender && !isReceiver) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: 'You can only delete your own messages',
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = currentUserId;
    await message.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Message deleted successfully',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Search connections/friends for messaging
   * GET /api/v1/chat/search-connections
   */
  searchConnections = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { search = '', limit = 20 } = req.query;

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

    // Optimize: Fetch friendships and conversations in parallel
    const [friendships, conversations] = await Promise.all([
      Friend.find({
        $or: [
          { requester: currentUserIdObj, status: 'accepted' },
          { recipient: currentUserIdObj, status: 'accepted' }
        ]
      })
        .populate('requester', 'firstName lastName email profilePicture')
        .populate('recipient', 'firstName lastName email profilePicture')
        .limit(parseInt(limit)),
      Conversation.find({
        participants: currentUserIdObj,
        isBlocked: false
      })
        .populate({
          path: 'participants',
          select: 'firstName lastName email profilePicture',
          match: { _id: { $ne: currentUserIdObj } }
        })
        .limit(parseInt(limit))
    ]);

    // Combine connections and conversation participants
    const connectionMap = new Map();
    
    // Add connections
    friendships.forEach(friendship => {
      const friend = String(friendship.requester._id) === String(currentUserId)
        ? friendship.recipient
        : friendship.requester;
      
      if (friend && friend._id) {
        const userId = String(friend._id);
        if (!connectionMap.has(userId)) {
          connectionMap.set(userId, {
            _id: friend._id,
            firstName: friend.firstName,
            lastName: friend.lastName,
            email: friend.email,
            profilePicture: friend.profilePicture,
            isConnected: true,
            hasPastChat: false
          });
        } else {
          connectionMap.get(userId).isConnected = true;
        }
      }
    });

    // Add users with past conversations
    conversations.forEach(conv => {
      const participant = conv.participants.find(
        p => p && String(p._id) !== String(currentUserId)
      );
      
      if (participant && participant._id) {
        const userId = String(participant._id);
        if (!connectionMap.has(userId)) {
          connectionMap.set(userId, {
            _id: participant._id,
            firstName: participant.firstName,
            lastName: participant.lastName,
            email: participant.email,
            profilePicture: participant.profilePicture,
            isConnected: false,
            hasPastChat: true
          });
        } else {
          connectionMap.get(userId).hasPastChat = true;
        }
      }
    });

    let results = Array.from(connectionMap.values());

    // Apply search filter if provided
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      results = results.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Sort: connected first, then by name
    results.sort((a, b) => {
      if (a.isConnected !== b.isConnected) {
        return b.isConnected ? 1 : -1;
      }
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Connections retrieved successfully',
      data: {
        connections: results.slice(0, parseInt(limit)),
        total: results.length
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Get online status for conversation participants
   * GET /api/v1/chat/online-status
   */
  getOnlineStatus = asyncHandler(async (req, res) => {
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

    // Get all conversations
    const conversations = await Conversation.find({
      participants: currentUserIdObj,
      isBlocked: false
    }).select('participants');

    // Get all unique participant IDs
    const participantIds = new Set();
    conversations.forEach(conv => {
      conv.participants.forEach(participant => {
        const participantId = String(participant);
        if (participantId !== String(currentUserId)) {
          participantIds.add(participantId);
        }
      });
    });

    // Get online status from UserPresence
    const onlinePresences = await UserPresence.find({
      user: { $in: Array.from(participantIds).map(id => new mongoose.Types.ObjectId(id)) },
      isOnline: true
    }).select('user');

    const onlineUserIds = new Set(onlinePresences.map(p => String(p.user)));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Online status retrieved successfully',
      data: {
        onlineUsers: Array.from(onlineUserIds)
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Block/unblock a conversation
   * PUT /api/v1/chat/block/:userId
   */
  blockConversation = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { userId } = req.params;
    const { block = true } = req.body;

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
    const userIdObj = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserIdObj, userIdObj] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserIdObj, userIdObj]
      });
    }

    conversation.isBlocked = block;
    if (block) {
      conversation.blockedBy = currentUserIdObj;
      conversation.blockedAt = new Date();
    } else {
      conversation.blockedBy = null;
      conversation.blockedAt = null;
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: block ? 'Conversation blocked' : 'Conversation unblocked',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Add or remove reaction to a message
   * POST /api/v1/chat/message/:messageId/reaction
   */
  addReaction = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id || req.userId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!messageId || !emoji) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Message ID and emoji are required',
        timestamp: new Date().toISOString()
      });
    }

    const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(currentUserId))
      ? new mongoose.Types.ObjectId(String(currentUserId))
      : currentUserId;
    const messageIdObj = mongoose.Types.ObjectId.isValid(String(messageId))
      ? new mongoose.Types.ObjectId(String(messageId))
      : messageId;

    const message = await Message.findById(messageIdObj);
    if (!message) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Message not found',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => String(r.user) === String(currentUserIdObj) && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(String(r.user) === String(currentUserIdObj) && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        user: currentUserIdObj,
        emoji: emoji,
        createdAt: new Date()
      });
    }

    await message.save();
    await message.populate('reactions.user', 'firstName lastName profilePicture');

    // Emit socket event for real-time update
    if (this.chatService && this.chatService.io) {
      const receiverId = String(message.sender) === String(currentUserIdObj) 
        ? String(message.receiver) 
        : String(message.sender);
      
      // Emit to both sender and receiver
      this.chatService.io.to(`user:${String(message.sender)}`).emit('chat:message:reaction', {
        messageId: message._id,
        reactions: message.reactions
      });
      this.chatService.io.to(`user:${receiverId}`).emit('chat:message:reaction', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: existingReaction ? 'Reaction removed' : 'Reaction added',
      data: {
        message: message,
        reactions: message.reactions
      },
      timestamp: new Date().toISOString()
    });
  });
}

const chatController = new ChatController();
export default chatController;

