import { Message, Conversation } from '../models/Chat.js';
import Friend from '../models/Friend.js';
import mongoose from 'mongoose';

/**
 * Chat Service
 * Shared business logic for chat operations (used by both HTTP and Socket handlers)
 */
class ChatService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Send a message and emit socket events
   * @param {Object} messageData - Message data
   * @param {Object} socket - Socket instance (optional, for socket-based sends)
   * @returns {Object} Created message
   */
  async sendMessage(messageData, socket = null) {
    const {
      senderId,
      receiverId,
      content,
      messageType = 'text',
      attachment = null,
      replyTo = null
    } = messageData;

    const senderIdObj = mongoose.Types.ObjectId.isValid(String(senderId))
      ? new mongoose.Types.ObjectId(String(senderId))
      : senderId;
    const receiverIdObj = mongoose.Types.ObjectId.isValid(String(receiverId))
      ? new mongoose.Types.ObjectId(String(receiverId))
      : receiverId;

    // Check if users can message
    const [friendship, existingConversation] = await Promise.all([
      Friend.findOne({
        $or: [
          { requester: senderIdObj, recipient: receiverIdObj },
          { requester: receiverIdObj, recipient: senderIdObj }
        ],
        status: 'accepted'
      }),
      Conversation.findOne({
        participants: { $all: [senderIdObj, receiverIdObj] }
      })
    ]);

    const canMessage = friendship || existingConversation;
    if (!canMessage) {
      throw new Error('You can only message connections or users with past chat history');
    }

    // Get or create conversation
    let conversation = existingConversation;
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderIdObj, receiverIdObj],
        unreadCount: new Map([[String(receiverIdObj), 0]])
      });
    }

    // Check if conversation is blocked
    if (conversation.isBlocked) {
      throw new Error('This conversation is blocked');
    }

    // Create message
    const message = await Message.create({
      sender: senderIdObj,
      receiver: receiverIdObj,
      content: content || '',
      messageType: messageType,
      attachment: attachment,
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : null
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    const receiverIdStr = String(receiverIdObj);
    const currentUnread = conversation.unreadCount.get(receiverIdStr) || 0;
    conversation.unreadCount.set(receiverIdStr, currentUnread + 1);
    await conversation.save();

    // Populate message
    await message.populate([
      { path: 'sender', select: 'firstName lastName email profilePicture' },
      { path: 'receiver', select: 'firstName lastName email profilePicture' },
      { path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'firstName lastName' } }
    ]);

    // Emit socket events
    if (this.io) {
      const senderIdStr = String(senderIdObj);
      
      // Emit to sender (confirmation)
      if (socket) {
        socket.emit('chat:message:sent', {
          success: true,
          message
        });
      } else {
        // For HTTP requests, emit to sender's room
        this.io.to(`user:${senderIdStr}`).emit('chat:message:sent', {
          success: true,
          message
        });
      }

      // Emit to receiver (new message)
      console.log(`📤 Emitting message to user:${receiverIdStr}`, {
        messageId: message._id,
        sender: senderIdStr,
        receiver: receiverIdStr
      });

      this.io.to(`user:${receiverIdStr}`).emit('chat:message:new', {
        message,
        conversationId: conversation._id
      });

      // Mark as delivered when receiver is online (they'll acknowledge via socket)
      // For now, we'll mark as delivered when they receive the socket event
      // The frontend will emit 'chat:message:delivered' when message is displayed

      // Update conversation list for both users
      this.io.to(`user:${senderIdStr}`).emit('chat:conversation:updated', {
        conversationId: conversation._id
      });
      this.io.to(`user:${receiverIdStr}`).emit('chat:conversation:updated', {
        conversationId: conversation._id
      });
    }

    return message;
  }
}

export default ChatService;

