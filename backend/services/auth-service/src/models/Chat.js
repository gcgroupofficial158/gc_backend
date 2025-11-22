import mongoose from 'mongoose';

/**
 * Chat Message Schema
 * Stores individual chat messages between users
 */
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    trim: true,
    default: ''
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'pdf', 'video', 'file'],
    default: 'text'
  },
  attachment: {
    url: {
      type: String,
      trim: true
    },
    filename: {
      type: String,
      trim: true
    },
    mimeType: {
      type: String,
      trim: true
    },
    size: {
      type: Number // Size in bytes
    },
    thumbnail: {
      type: String, // For images/videos
      trim: true
    }
  },
  isDelivered: {
    type: Boolean,
    default: false,
    index: true
  },
  deliveredAt: {
    type: Date
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1, isDeleted: 1 });

/**
 * Conversation Schema
 * Tracks conversation metadata and participants
 */
const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockedAt: {
    type: Date
  },
  isArchived: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  isPinned: {
    type: Map,
    of: Boolean,
    default: new Map()
  }
}, {
  timestamps: true
});

// Ensure unique conversations between two users
conversationSchema.index({ participants: 1 }, { unique: true });

// Index for fetching user conversations
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Pre-save hook to ensure participants array has exactly 2 users
conversationSchema.pre('save', function(next) {
  if (this.participants && this.participants.length === 2) {
    // Sort participants to ensure consistency
    this.participants.sort();
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

export { Message, Conversation };
export default Message;

