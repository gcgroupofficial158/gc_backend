import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: function() {
      return !this.provider || this.provider === 'email';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  // OAuth Provider fields
  provider: {
    type: String,
    enum: ['email', 'google', 'facebook', 'github'],
    default: 'email'
  },
  googleId: {
    type: String,
    sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
    unique: true
  },
  profilePicture: {
    type: String,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 days
    }
  }],
  sessions: [{
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown'
      },
      browser: String,
      os: String
    },
    location: {
      country: String,
      city: String,
      timezone: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }
    }
  }],
  maxConcurrentSessions: {
    type: Number,
    default: 3
  },
  sessionTimeout: {
    type: Number,
    default: 30 * 60 * 1000 // 30 minutes in milliseconds
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for better performance (email index is automatically created by unique: true)
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Instance method to create a new session
userSchema.methods.createSession = function(sessionData) {
  const session = {
    sessionId: sessionData.sessionId,
    deviceInfo: sessionData.deviceInfo,
    location: sessionData.location,
    isActive: true,
    lastActivity: new Date(),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
  
  this.sessions.push(session);
  return session;
};

// Instance method to find active session by session ID
userSchema.methods.findActiveSession = function(sessionId) {
  return this.sessions.find(session => 
    session.sessionId === sessionId && 
    session.isActive && 
    session.expiresAt > new Date()
  );
};

// Instance method to update session activity
userSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.findActiveSession(sessionId);
  if (session) {
    session.lastActivity = new Date();
    return true;
  }
  return false;
};

// Instance method to deactivate session
userSchema.methods.deactivateSession = function(sessionId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.isActive = false;
    return true;
  }
  return false;
};

// Instance method to deactivate all sessions
userSchema.methods.deactivateAllSessions = function() {
  this.sessions.forEach(session => {
    session.isActive = false;
  });
  return true;
};

// Instance method to clean expired sessions
userSchema.methods.cleanExpiredSessions = function() {
  const now = new Date();
  this.sessions = this.sessions.filter(session => 
    session.expiresAt > now && session.isActive
  );
  return this.sessions.length;
};

// Instance method to check if user has exceeded max concurrent sessions
userSchema.methods.hasExceededMaxSessions = function() {
  const activeSessions = this.sessions.filter(session => 
    session.isActive && session.expiresAt > new Date()
  );
  return activeSessions.length >= this.maxConcurrentSessions;
};

// Instance method to get oldest active session
userSchema.methods.getOldestActiveSession = function() {
  const activeSessions = this.sessions.filter(session => 
    session.isActive && session.expiresAt > new Date()
  );
  
  if (activeSessions.length === 0) return null;
  
  return activeSessions.reduce((oldest, current) => 
    current.lastActivity < oldest.lastActivity ? current : oldest
  );
};

// Instance method to check if session is timed out
userSchema.methods.isSessionTimedOut = function(sessionId) {
  const session = this.findActiveSession(sessionId);
  if (!session) return true;
  
  const now = new Date();
  const timeSinceLastActivity = now - session.lastActivity;
  
  return timeSinceLastActivity > this.sessionTimeout;
};

export default mongoose.model('User', userSchema);
