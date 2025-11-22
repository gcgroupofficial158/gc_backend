import mongoose from 'mongoose';

const userPresenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String
  },
  status: {
    type: String,
    enum: ['online', 'away', 'offline'],
    default: 'offline'
  }
}, {
  timestamps: true
});

// Indexes
userPresenceSchema.index({ user: 1 });
userPresenceSchema.index({ isOnline: 1 });
userPresenceSchema.index({ socketId: 1 });

const UserPresence = mongoose.model('UserPresence', userPresenceSchema);

export default UserPresence;

