import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Basic Information
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
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  
  // Profile Information
  profileImage: {
    original: {
      url: String,
      filename: String,
      size: Number,
      mimeType: String
    },
    thumbnail: {
      url: String,
      filename: String,
      size: Number
    }
  },
  
  // Personal Information
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [100, 'Street address cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters']
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters']
    }
  },
  
  // Professional Information
  occupation: {
    type: String,
    trim: true,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  },
  
  // Social Media Links
  socialLinks: {
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/, 'Please enter a valid LinkedIn profile URL']
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?twitter\.com\/.+/, 'Please enter a valid Twitter profile URL']
    },
    github: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?github\.com\/.+/, 'Please enter a valid GitHub profile URL']
    },
    instagram: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?instagram\.com\/.+/, 'Please enter a valid Instagram profile URL']
    }
  },
  
  // Documents
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['resume', 'certificate', 'portfolio', 'other']
    },
    file: {
      url: String,
      filename: String,
      size: Number,
      mimeType: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends-only'],
      default: 'public'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // System Fields
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastProfileUpdate: {
    type: Date,
    default: Date.now
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

// Virtual for age calculation
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'address.city': 1 });
userSchema.index({ 'address.country': 1 });
userSchema.index({ occupation: 1 });
userSchema.index({ company: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastProfileUpdate = new Date();
  }
  next();
});

// Instance methods
userSchema.methods.updateProfile = function(updateData) {
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'bio',
    'address', 'occupation', 'company', 'website', 'socialLinks', 'preferences'
  ];
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });
  
  return this.save();
};

userSchema.methods.addDocument = function(documentData) {
  this.documents.push(documentData);
  return this.save();
};

userSchema.methods.removeDocument = function(documentId) {
  this.documents = this.documents.filter(doc => doc._id.toString() !== documentId);
  return this.save();
};

userSchema.methods.updateProfileImage = function(imageData) {
  this.profileImage = imageData;
  return this.save();
};

userSchema.methods.getPublicProfile = function() {
  const publicFields = [
    'firstName', 'lastName', 'profileImage', 'bio', 'occupation', 
    'company', 'website', 'socialLinks', 'preferences.profileVisibility'
  ];
  
  const publicProfile = {};
  publicFields.forEach(field => {
    if (this[field] !== undefined) {
      publicProfile[field] = this[field];
    }
  });
  
  return publicProfile;
};

export default mongoose.model('User', userSchema);
