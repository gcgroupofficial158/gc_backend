import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../config/config.js';
import User from '../models/User.js';
import UserPresence from '../models/UserPresence.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Friend from '../models/Friend.js';
import { Message, Conversation } from '../models/Chat.js';
import ChatService from '../services/chatService.js';

/**
 * Socket.io Handler
 * Manages real-time communication for posts, comments, likes, friends, and user presence
 */
class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // socketId -> userId
    this.processingReactions = new Map(); // postId -> Set of userIds currently processing
    this.chatService = new ChatService(io);
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.io middleware for authentication
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
          return next(new Error('Authentication error: User not found or inactive'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`✅ User connected: ${socket.userId} (Socket: ${socket.id})`);
      
      // Store user connection
      this.connectedUsers.set(socket.id, socket.userId);
      
      // Update user presence
      await this.updateUserPresence(socket.userId, true, socket.id);
      
      // Join user's personal room - use string ID for consistency
      const userIdStr = String(socket.userId);
      socket.join(`user:${userIdStr}`);
      
      console.log(`✅ User ${userIdStr} joined room: user:${userIdStr}`);
      
      // Broadcast user online status to friends and past conversation participants
      await this.broadcastUserStatus(socket.userId, 'online');

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`❌ User disconnected: ${socket.userId} (Socket: ${socket.id})`);
        this.connectedUsers.delete(socket.id);
        
        // Check if user has other connections
        const hasOtherConnections = Array.from(this.connectedUsers.values()).includes(socket.userId);
        
        if (!hasOtherConnections) {
          await this.updateUserPresence(socket.userId, false, null);
          await this.broadcastUserStatus(socket.userId, 'offline');
        }
      });

      // Real-time Post Events
      socket.on('post:create', async (data) => {
        await this.handlePostCreate(socket, data);
      });

      socket.on('post:like', async (data) => {
        await this.handlePostLike(socket, data);
      });

      socket.on('post:unlike', async (data) => {
        await this.handlePostUnlike(socket, data);
      });

      socket.on('post:dislike', async (data) => {
        await this.handlePostDislike(socket, data);
      });

      socket.on('post:undislike', async (data) => {
        await this.handlePostUndislike(socket, data);
      });

      // Real-time Comment Events
      socket.on('comment:create', async (data) => {
        await this.handleCommentCreate(socket, data);
      });

      socket.on('comment:like', async (data) => {
        await this.handleCommentLike(socket, data);
      });

      // Real-time Friend Events
      socket.on('friend:request', async (data) => {
        await this.handleFriendRequest(socket, data);
      });

      socket.on('friend:accept', async (data) => {
        await this.handleFriendAccept(socket, data);
      });

      socket.on('friend:reject', async (data) => {
        await this.handleFriendReject(socket, data);
      });

      socket.on('friend:cancel', async (data) => {
        await this.handleFriendCancel(socket, data);
      });

      socket.on('friend:block', async (data) => {
        await this.handleFriendBlock(socket, data);
      });

      socket.on('friend:remove', async (data) => {
        await this.handleFriendRemove(socket, data);
      });

      // User Presence Events
      socket.on('presence:update', async (data) => {
        await this.updateUserPresence(socket.userId, data.isOnline, socket.id, data.status);
      });

      // Real-time Chat Events
      socket.on('chat:message', async (data) => {
        await this.handleChatMessage(socket, data);
      });

      socket.on('chat:typing', async (data) => {
        await this.handleChatTyping(socket, data);
      });

      socket.on('chat:read', async (data) => {
        await this.handleChatRead(socket, data);
      });

      socket.on('chat:message:delivered', async (data) => {
        await this.handleChatMessageDelivered(socket, data);
      });

      socket.on('chat:message:reaction', async (data) => {
        await this.handleChatMessageReaction(socket, data);
      });

      // Join conversation room
      socket.on('chat:join', async (data) => {
        await this.handleChatJoin(socket, data);
      });

      // Leave conversation room
      socket.on('chat:leave', async (data) => {
        await this.handleChatLeave(socket, data);
      });
    });
  }

  /**
   * Update user presence in database
   */
  async updateUserPresence(userId, isOnline, socketId = null, status = 'online') {
    try {
      await UserPresence.findOneAndUpdate(
        { user: userId },
        {
          user: userId,
          isOnline,
          socketId,
          status: isOnline ? status : 'offline',
          lastSeen: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  /**
   * Broadcast user status to friends and users with past conversations
   */
  async broadcastUserStatus(userId, status) {
    try {
      const user = await User.findById(userId).select('firstName lastName profilePicture');
      if (!user) return;

      const friends = await Friend.find({
        $or: [
          { requester: userId, status: 'accepted' },
          { recipient: userId, status: 'accepted' }
        ]
      }).populate('requester recipient', 'firstName lastName profilePicture');

      // Get users with past conversations
      const conversations = await Conversation.find({
        participants: userId,
        isBlocked: false
      });

      const userIdStr = String(userId);
      const relatedUserIds = new Set();

      // Add friends
      friends.forEach((friendship) => {
        const friendId = friendship.requester._id.toString() === userIdStr 
          ? String(friendship.recipient._id)
          : String(friendship.requester._id);
        relatedUserIds.add(friendId);
      });
        
      // Add conversation participants
      conversations.forEach((conv) => {
        conv.participants.forEach(participant => {
          const participantId = String(participant);
          if (participantId !== userIdStr) {
            relatedUserIds.add(participantId);
          }
        });
      });

      // Emit to all related users
      relatedUserIds.forEach(friendId => {
        this.io.to(`user:${friendId}`).emit(status === 'online' ? 'user:online' : 'user:offline', {
            userId,
            status,
            user: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePicture: user.profilePicture
            }
        });
      });
    } catch (error) {
      console.error('Error broadcasting user status:', error);
    }
  }

  /**
   * Handle post creation
   */
  async handlePostCreate(socket, data) {
    try {
      const post = await Post.create({
        author: socket.userId,
        type: data.type || 'post',
        content: data.content,
        tags: data.tags || [],
        visibility: data.visibility || 'public'
      });

      await post.populate('author', 'firstName lastName profilePicture email');

      // Format post for broadcast
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
        likes: [],
        comments: [],
        shares: [],
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isLiked: false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };

      // Broadcast to all connected users (or friends if visibility is restricted)
      if (post.visibility === 'public') {
        this.io.emit('post:new', {
          post: formattedPost
        });
      } else {
        // Send to connections only
        const friends = await Friend.find({
          $or: [
            { requester: socket.userId, status: 'accepted' },
            { recipient: socket.userId, status: 'accepted' }
          ]
        });

        friends.forEach(friendship => {
          const friendId = friendship.requester.toString() === socket.userId 
            ? friendship.recipient.toString() 
            : friendship.requester.toString();
          
          this.io.to(`user:${friendId}`).emit('post:new', {
            post: formattedPost
          });
        });
      }

      socket.emit('post:created', { success: true, post });
    } catch (error) {
      console.error('Error creating post:', error);
      socket.emit('post:error', { error: error.message });
    }
  }

  /**
   * Handle post like
   */
  async handlePostLike(socket, data) {
    try {
      const postId = data.postId?.toString();
      const userId = socket.userId?.toString();
      
      if (!postId || !userId) {
        return socket.emit('post:error', { error: 'Invalid post ID or user ID' });
      }

      // Check if this post is currently being processed by this user
      const processingKey = `${postId}-${userId}`;
      if (this.processingReactions.has(processingKey)) {
        return; // Ignore duplicate requests
      }

      // Mark as processing
      this.processingReactions.set(processingKey, Date.now());

      const post = await Post.findById(postId);
      if (!post) {
        this.processingReactions.delete(processingKey);
        return socket.emit('post:error', { error: 'Post not found' });
      }

      const alreadyLiked = post.likes.some(
        like => like.user.toString() === userId
      );
      const alreadyDisliked = post.dislikes.some(
        dislike => dislike.user.toString() === userId
      );

      if (!alreadyLiked) {
        // Remove from dislikes if user had disliked
        if (alreadyDisliked) {
          post.dislikes = post.dislikes.filter(
            dislike => dislike.user.toString() !== userId
          );
        }
        
        post.likes.push({ user: userId });
        await post.save();

        await post.populate('author', 'firstName lastName');
        await post.populate('likes.user', 'firstName lastName profilePicture');

        // Broadcast to all users
        this.io.emit('post:liked', {
          postId: post._id,
          userId: userId,
          user: socket.user,
          likeCount: post.likes.length,
          dislikeCount: post.dislikes.length
        });
      }

      // Clear processing flag after a delay
      setTimeout(() => {
        this.processingReactions.delete(processingKey);
      }, 1000);
    } catch (error) {
      console.error('Error liking post:', error);
      socket.emit('post:error', { error: error.message });
      // Clear processing flag on error
      const processingKey = `${data.postId?.toString()}-${socket.userId?.toString()}`;
      this.processingReactions.delete(processingKey);
    }
  }

  /**
   * Handle post unlike
   */
  async handlePostUnlike(socket, data) {
    try {
      const postId = data.postId?.toString();
      const userId = socket.userId?.toString();
      
      if (!postId || !userId) {
        return socket.emit('post:error', { error: 'Invalid post ID or user ID' });
      }

      // Check if this post is currently being processed by this user
      const processingKey = `${postId}-${userId}`;
      if (this.processingReactions.has(processingKey)) {
        return; // Ignore duplicate requests
      }

      // Mark as processing
      this.processingReactions.set(processingKey, Date.now());

      const post = await Post.findById(postId);
      if (!post) {
        this.processingReactions.delete(processingKey);
        return socket.emit('post:error', { error: 'Post not found' });
      }

      post.likes = post.likes.filter(
        like => like.user.toString() !== userId
      );
      await post.save();

      // Broadcast to all users
      this.io.emit('post:unliked', {
        postId: post._id,
        userId: userId,
        likeCount: post.likes.length,
        dislikeCount: post.dislikes.length
      });

      // Clear processing flag after a delay
      setTimeout(() => {
        this.processingReactions.delete(processingKey);
      }, 1000);
    } catch (error) {
      console.error('Error unliking post:', error);
      socket.emit('post:error', { error: error.message });
      // Clear processing flag on error
      const processingKey = `${data.postId?.toString()}-${socket.userId?.toString()}`;
      this.processingReactions.delete(processingKey);
    }
  }

  /**
   * Handle post dislike
   */
  async handlePostDislike(socket, data) {
    try {
      const postId = data.postId?.toString();
      const userId = socket.userId?.toString();
      
      if (!postId || !userId) {
        return socket.emit('post:error', { error: 'Invalid post ID or user ID' });
      }

      // Check if this post is currently being processed by this user
      const processingKey = `${postId}-${userId}`;
      if (this.processingReactions.has(processingKey)) {
        return; // Ignore duplicate requests
      }

      // Mark as processing
      this.processingReactions.set(processingKey, Date.now());

      const post = await Post.findById(postId);
      if (!post) {
        this.processingReactions.delete(processingKey);
        return socket.emit('post:error', { error: 'Post not found' });
      }

      const alreadyDisliked = post.dislikes.some(
        dislike => dislike.user.toString() === userId
      );
      const alreadyLiked = post.likes.some(
        like => like.user.toString() === userId
      );

      if (!alreadyDisliked) {
        // Remove from likes if user had liked
        if (alreadyLiked) {
          post.likes = post.likes.filter(
            like => like.user.toString() !== userId
          );
        }
        
        post.dislikes.push({ user: userId });
        await post.save();

        await post.populate('author', 'firstName lastName');
        await post.populate('dislikes.user', 'firstName lastName profilePicture');

        // Broadcast to all users
        this.io.emit('post:disliked', {
          postId: post._id,
          userId: userId,
          user: socket.user,
          likeCount: post.likes.length,
          dislikeCount: post.dislikes.length
        });
      }

      // Clear processing flag after a delay
      setTimeout(() => {
        this.processingReactions.delete(processingKey);
      }, 1000);
    } catch (error) {
      console.error('Error disliking post:', error);
      socket.emit('post:error', { error: error.message });
      // Clear processing flag on error
      const processingKey = `${data.postId?.toString()}-${socket.userId?.toString()}`;
      this.processingReactions.delete(processingKey);
    }
  }

  /**
   * Handle post undislike
   */
  async handlePostUndislike(socket, data) {
    try {
      const postId = data.postId?.toString();
      const userId = socket.userId?.toString();
      
      if (!postId || !userId) {
        return socket.emit('post:error', { error: 'Invalid post ID or user ID' });
      }

      // Check if this post is currently being processed by this user
      const processingKey = `${postId}-${userId}`;
      if (this.processingReactions.has(processingKey)) {
        return; // Ignore duplicate requests
      }

      // Mark as processing
      this.processingReactions.set(processingKey, Date.now());

      const post = await Post.findById(postId);
      if (!post) {
        this.processingReactions.delete(processingKey);
        return socket.emit('post:error', { error: 'Post not found' });
      }

      post.dislikes = post.dislikes.filter(
        dislike => dislike.user.toString() !== userId
      );
      await post.save();

      // Broadcast to all users
      this.io.emit('post:undisliked', {
        postId: post._id,
        userId: userId,
        likeCount: post.likes.length,
        dislikeCount: post.dislikes.length
      });

      // Clear processing flag after a delay
      setTimeout(() => {
        this.processingReactions.delete(processingKey);
      }, 1000);
    } catch (error) {
      console.error('Error undisliking post:', error);
      socket.emit('post:error', { error: error.message });
      // Clear processing flag on error
      const processingKey = `${data.postId?.toString()}-${socket.userId?.toString()}`;
      this.processingReactions.delete(processingKey);
    }
  }

  /**
   * Handle comment creation
   */
  async handleCommentCreate(socket, data) {
    try {
      const comment = await Comment.create({
        post: data.postId,
        author: socket.userId,
        content: data.content,
        parentComment: data.parentCommentId || null
      });

      // Update post comments array
      const post = await Post.findById(data.postId);
      if (post) {
        post.comments.push(comment._id);
        await post.save();
      }

      await comment.populate('author', 'firstName lastName profilePicture');

      // Broadcast to all users
      this.io.emit('comment:new', {
        comment: {
          _id: comment._id,
          post: comment.post,
          author: comment.author,
          content: comment.content,
          likes: [],
          replies: [],
          parentComment: comment.parentComment,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        },
        postId: data.postId
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      socket.emit('comment:error', { error: error.message });
    }
  }

  /**
   * Handle comment like
   */
  async handleCommentLike(socket, data) {
    try {
      const comment = await Comment.findById(data.commentId);
      if (!comment) {
        return socket.emit('comment:error', { error: 'Comment not found' });
      }

      const alreadyLiked = comment.likes.some(
        like => like.user.toString() === socket.userId
      );

      if (!alreadyLiked) {
        comment.likes.push({ user: socket.userId });
        await comment.save();

        // Broadcast to all users
        this.io.emit('comment:liked', {
          commentId: comment._id,
          userId: socket.userId,
          likeCount: comment.likes.length
        });
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      socket.emit('comment:error', { error: error.message });
    }
  }

  /**
   * Handle friend request
   */
  async handleFriendRequest(socket, data) {
    try {
      const existingRequest = await Friend.findOne({
        $or: [
          { requester: socket.userId, recipient: data.userId },
          { requester: data.userId, recipient: socket.userId }
        ]
      });

      if (existingRequest) {
        return socket.emit('friend:error', { error: 'Friend request already exists' });
      }

      const friendRequest = await Friend.create({
        requester: socket.userId,
        recipient: data.userId,
        status: 'pending'
      });

      await friendRequest.populate('requester', 'firstName lastName profilePicture');
      await friendRequest.populate('recipient', 'firstName lastName profilePicture');

      // Notify recipient
      this.io.to(`user:${data.userId}`).emit('friend:request:received', {
        request: {
          _id: friendRequest._id,
          requester: friendRequest.requester,
          recipient: friendRequest.recipient,
          status: friendRequest.status,
          createdAt: friendRequest.createdAt
        }
      });

      socket.emit('friend:request:sent', { success: true, request: friendRequest });
    } catch (error) {
      console.error('Error sending friend request:', error);
      socket.emit('friend:error', { error: error.message });
    }
  }

  /**
   * Handle friend accept
   */
  async handleFriendAccept(socket, data) {
    try {
      const friendRequest = await Friend.findOne({
        recipient: socket.userId,
        requester: data.userId,
        status: 'pending'
      });

      if (!friendRequest) {
        return socket.emit('friend:error', { error: 'Friend request not found' });
      }

      friendRequest.status = 'accepted';
      friendRequest.acceptedAt = new Date();
      await friendRequest.save();

      await friendRequest.populate('requester', 'firstName lastName profilePicture');
      await friendRequest.populate('recipient', 'firstName lastName profilePicture');

      // Notify both users
      this.io.to(`user:${data.userId}`).emit('friend:accepted', {
        request: friendRequest
      });

      socket.emit('friend:accepted', { success: true, request: friendRequest });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      socket.emit('friend:error', { error: error.message });
    }
  }

  /**
   * Handle friend reject
   */
  async handleFriendReject(socket, data) {
    try {
      const friendRequest = await Friend.findOneAndDelete({
        recipient: socket.userId,
        requester: data.userId,
        status: 'pending'
      });

      if (!friendRequest) {
        return socket.emit('friend:error', { error: 'Friend request not found' });
      }

      // Notify requester
      this.io.to(`user:${data.userId}`).emit('friend:rejected', {
        userId: socket.userId
      });

      socket.emit('friend:rejected', { success: true });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      socket.emit('friend:error', { error: error.message });
    }
  }

  /**
   * Handle friend cancel
   */
  async handleFriendCancel(socket, data) {
    try {
      const friendRequest = await Friend.findOneAndDelete({
        requester: socket.userId,
        recipient: data.userId,
        status: 'pending'
      });

      if (!friendRequest) {
        return socket.emit('friend:error', { error: 'Friend request not found' });
      }

      // Notify recipient that request was cancelled
      this.io.to(`user:${data.userId}`).emit('friend:cancelled', {
        userId: socket.userId
      });

      socket.emit('friend:cancelled', { success: true, userId: data.userId });
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      socket.emit('friend:error', { error: error.message });
    }
  }

  /**
   * Handle friend block
   */
  async handleFriendBlock(socket, data) {
    try {
      const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(socket.userId))
        ? new mongoose.Types.ObjectId(String(socket.userId))
        : socket.userId;
      const userIdObj = mongoose.Types.ObjectId.isValid(String(data.userId))
        ? new mongoose.Types.ObjectId(String(data.userId))
        : data.userId;

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

      // Notify the blocked user
      this.io.to(`user:${data.userId}`).emit('friend:blocked', {
        userId: socket.userId
      });

      socket.emit('friend:blocked', { success: true, userId: data.userId });
    } catch (error) {
      console.error('Error blocking user:', error);
      socket.emit('friend:error', { error: error.message });
    }
  }

  /**
   * Handle friend remove (unfriend)
   */
  async handleFriendRemove(socket, data) {
    try {
      const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(socket.userId))
        ? new mongoose.Types.ObjectId(String(socket.userId))
        : socket.userId;
      const userIdObj = mongoose.Types.ObjectId.isValid(String(data.userId))
        ? new mongoose.Types.ObjectId(String(data.userId))
        : data.userId;

      // Delete accepted friendship
      const friendRequest = await Friend.findOneAndDelete({
        $or: [
          { requester: currentUserIdObj, recipient: userIdObj, status: 'accepted' },
          { requester: userIdObj, recipient: currentUserIdObj, status: 'accepted' }
        ]
      });

      if (!friendRequest) {
        return socket.emit('friend:error', { error: 'Connection not found' });
      }

      // Notify the other user
      this.io.to(`user:${data.userId}`).emit('friend:removed', {
        userId: socket.userId
      });

      socket.emit('friend:removed', { success: true, userId: data.userId });
    } catch (error) {
      console.error('Error removing connection:', error);
      socket.emit('friend:error', { error: error.message });
    }
  }

  /**
   * Get online users
   */
  async getOnlineUsers() {
    const onlinePresences = await UserPresence.find({ isOnline: true })
      .populate('user', 'firstName lastName profilePicture');
    return onlinePresences.map(p => p.user);
  }

  /**
   * Handle chat message
   */
  async handleChatMessage(socket, data) {
    try {
      const { receiverId, content, messageType = 'text', attachment, replyTo } = data;
      
      if (!receiverId) {
        return socket.emit('chat:error', { error: 'Receiver ID is required' });
      }

      // Use ChatService to send message (handles all logic and socket events)
      const message = await this.chatService.sendMessage({
        senderId: socket.userId,
        receiverId: receiverId,
        content: content || '',
        messageType: messageType,
        attachment: attachment || null,
        replyTo: replyTo || null
      }, socket);

      console.log('✅ Message sent via socket:', message._id);
    } catch (error) {
      console.error('❌ Error handling chat message:', error);
      socket.emit('chat:error', { error: error.message || 'Failed to send message' });
    }
  }

  /**
   * Handle chat typing indicator
   */
  async handleChatTyping(socket, data) {
    try {
      const { receiverId, isTyping } = data;
      
      if (!receiverId) return;

      // Emit typing indicator to receiver
      this.io.to(`user:${receiverId}`).emit('chat:typing', {
        userId: socket.userId,
        isTyping: isTyping !== false
      });
    } catch (error) {
      console.error('❌ Error handling chat typing:', error);
    }
  }

  /**
   * Handle message delivery acknowledgment
   */
  async handleChatMessageDelivered(socket, data) {
    try {
      const { messageId } = data;
      
      if (!messageId) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Only update if not already delivered
      if (!message.isDelivered) {
        message.isDelivered = true;
        message.deliveredAt = new Date();
        await message.save();

        // Emit delivery receipt to sender
        const senderIdStr = String(message.sender);
        this.io.to(`user:${senderIdStr}`).emit('chat:message:delivered', {
          messageId: message._id,
          deliveredAt: message.deliveredAt
        });
      }
    } catch (error) {
      console.error('❌ Error handling message delivery:', error);
    }
  }

  /**
   * Handle chat read receipt
   */
  async handleChatRead(socket, data) {
    try {
      const { senderId } = data;
      
      if (!senderId) return;

      const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(socket.userId))
        ? new mongoose.Types.ObjectId(String(socket.userId))
        : socket.userId;
      const senderIdObj = mongoose.Types.ObjectId.isValid(String(senderId))
        ? new mongoose.Types.ObjectId(String(senderId))
        : senderId;

      // Mark messages as read
      const updateResult = await Message.updateMany(
        {
          sender: senderIdObj,
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
        participants: { $all: [currentUserIdObj, senderIdObj] }
      });

      if (conversation) {
        conversation.unreadCount.set(String(currentUserIdObj), 0);
        await conversation.save();
      }

      // Emit read receipt to sender for all read messages
      if (updateResult.modifiedCount > 0) {
        const readMessages = await Message.find({
          sender: senderIdObj,
          receiver: currentUserIdObj,
          isRead: true
        }).select('_id readAt');

        readMessages.forEach(msg => {
          this.io.to(`user:${senderId}`).emit('chat:message:read', {
            messageId: msg._id,
            userId: socket.userId,
            readAt: msg.readAt || new Date()
      });
        });
      }
    } catch (error) {
      console.error('❌ Error handling chat read:', error);
    }
  }

  /**
   * Handle message reaction
   */
  async handleChatMessageReaction(socket, data) {
    try {
      const { messageId, emoji } = data;
      
      if (!messageId || !emoji) return;

      const currentUserIdObj = mongoose.Types.ObjectId.isValid(String(socket.userId))
        ? new mongoose.Types.ObjectId(String(socket.userId))
        : socket.userId;
      const messageIdObj = mongoose.Types.ObjectId.isValid(String(messageId))
        ? new mongoose.Types.ObjectId(String(messageId))
        : messageId;

      const message = await Message.findById(messageIdObj);
      if (!message) return;

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

      // Emit to both sender and receiver
      const receiverId = String(message.sender) === String(socket.userId) 
        ? String(message.receiver) 
        : String(message.sender);
      
      this.io.to(`user:${String(message.sender)}`).emit('chat:message:reaction', {
        messageId: message._id,
        reactions: message.reactions
      });
      this.io.to(`user:${receiverId}`).emit('chat:message:reaction', {
        messageId: message._id,
        reactions: message.reactions
      });
    } catch (error) {
      console.error('❌ Error handling message reaction:', error);
    }
  }

  /**
   * Handle joining a conversation room
   */
  async handleChatJoin(socket, data) {
    try {
      const { userId } = data;
      
      if (!userId) return;

      const roomId = [socket.userId, userId].sort().join(':');
      socket.join(`conversation:${roomId}`);
      
      socket.emit('chat:joined', { roomId: `conversation:${roomId}` });
    } catch (error) {
      console.error('❌ Error handling chat join:', error);
    }
  }

  /**
   * Handle leaving a conversation room
   */
  async handleChatLeave(socket, data) {
    try {
      const { userId } = data;
      
      if (!userId) return;

      const roomId = [socket.userId, userId].sort().join(':');
      socket.leave(`conversation:${roomId}`);
      
      socket.emit('chat:left', { roomId: `conversation:${roomId}` });
    } catch (error) {
      console.error('❌ Error handling chat leave:', error);
    }
  }
}

export default SocketHandler;

