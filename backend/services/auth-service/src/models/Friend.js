import mongoose from 'mongoose';

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendSchema.index({ recipient: 1, status: 1 });
friendSchema.index({ requester: 1, status: 1 });

// Prevent self-friending
friendSchema.pre('save', function(next) {
  try {
    if (this.requester && this.recipient) {
      const requesterStr = String(this.requester);
      const recipientStr = String(this.recipient);
      if (requesterStr === recipientStr) {
        const error = new Error('Cannot send friend request to yourself');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    next();
  } catch (hookError) {
    console.error('❌ Friend pre-save hook error:', hookError);
    next(hookError);
  }
});

const Friend = mongoose.model('Friend', friendSchema);

export default Friend;

