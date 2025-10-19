/**
 * Profile Response Interfaces
 * Defines response data structures for profile operations
 */

/**
 * Base API Response
 */
export class BaseResponse {
  constructor(success, statusCode, message, data = null, error = null) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Success Response
 */
export class SuccessResponse extends BaseResponse {
  constructor(message, data = null, statusCode = 200) {
    super(true, statusCode, message, data);
  }
}

/**
 * Error Response
 */
export class ErrorResponse extends BaseResponse {
  constructor(message, error = null, statusCode = 500) {
    super(false, statusCode, message, null, error);
  }
}

/**
 * Validation Error Response
 */
export class ValidationErrorResponse extends ErrorResponse {
  constructor(errors, statusCode = 400) {
    super('Validation failed', errors, statusCode);
  }
}

/**
 * Not Found Response
 */
export class NotFoundResponse extends ErrorResponse {
  constructor(message = 'Resource not found', statusCode = 404) {
    super(message, null, statusCode);
  }
}

/**
 * Unauthorized Response
 */
export class UnauthorizedResponse extends ErrorResponse {
  constructor(message = 'Unauthorized', statusCode = 401) {
    super(message, null, statusCode);
  }
}

/**
 * Forbidden Response
 */
export class ForbiddenResponse extends ErrorResponse {
  constructor(message = 'Forbidden', statusCode = 403) {
    super(message, null, statusCode);
  }
}

/**
 * Profile Response
 */
export class ProfileResponse {
  constructor(user) {
    this.id = user._id || user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.fullName = user.fullName;
    this.email = user.email;
    this.phone = user.phone;
    this.profileImage = user.profileImage;
    this.dateOfBirth = user.dateOfBirth;
    this.age = user.age;
    this.gender = user.gender;
    this.bio = user.bio;
    this.address = user.address;
    this.occupation = user.occupation;
    this.company = user.company;
    this.website = user.website;
    this.socialLinks = user.socialLinks;
    this.documents = user.documents || [];
    this.preferences = user.preferences;
    this.role = user.role;
    this.isActive = user.isActive;
    this.lastProfileUpdate = user.lastProfileUpdate;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  /**
   * Get public profile (limited fields)
   */
  getPublicProfile() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      profileImage: this.profileImage,
      bio: this.bio,
      occupation: this.occupation,
      company: this.company,
      website: this.website,
      socialLinks: this.socialLinks,
      preferences: {
        profileVisibility: this.preferences?.profileVisibility
      }
    };
  }

  /**
   * Get private profile (all fields)
   */
  getPrivateProfile() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      profileImage: this.profileImage,
      dateOfBirth: this.dateOfBirth,
      age: this.age,
      gender: this.gender,
      bio: this.bio,
      address: this.address,
      occupation: this.occupation,
      company: this.company,
      website: this.website,
      socialLinks: this.socialLinks,
      documents: this.documents,
      preferences: this.preferences,
      role: this.role,
      isActive: this.isActive,
      lastProfileUpdate: this.lastProfileUpdate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

/**
 * Profile List Response
 */
export class ProfileListResponse {
  constructor(users, pagination = null) {
    this.profiles = users.map(user => new ProfileResponse(user));
    this.pagination = pagination;
  }
}

/**
 * Profile Update Response
 */
export class ProfileUpdateResponse extends SuccessResponse {
  constructor(user, message = 'Profile updated successfully') {
    super(message, new ProfileResponse(user));
  }
}

/**
 * Profile Image Upload Response
 */
export class ProfileImageUploadResponse extends SuccessResponse {
  constructor(user, imageData, message = 'Profile image uploaded successfully') {
    super(message, {
      user: new ProfileResponse(user),
      imageData: imageData
    });
  }
}

/**
 * Document Upload Response
 */
export class DocumentUploadResponse extends SuccessResponse {
  constructor(user, document, message = 'Document uploaded successfully') {
    super(message, {
      user: new ProfileResponse(user),
      document: document
    });
  }
}

/**
 * Document Delete Response
 */
export class DocumentDeleteResponse extends SuccessResponse {
  constructor(user, message = 'Document deleted successfully') {
    super(message, new ProfileResponse(user));
  }
}

/**
 * Search Response
 */
export class SearchResponse extends SuccessResponse {
  constructor(users, query, total = null, message = 'Search completed successfully') {
    super(message, {
      query: query,
      results: users.map(user => new ProfileResponse(user).getPublicProfile()),
      total: total,
      count: users.length
    });
  }
}

/**
 * Statistics Response
 */
export class StatisticsResponse extends SuccessResponse {
  constructor(stats, message = 'Statistics retrieved successfully') {
    super(message, stats);
  }
}

/**
 * Health Check Response
 */
export class HealthCheckResponse extends SuccessResponse {
  constructor(service = 'Profile Service', version = '1.0.0', status = 'healthy') {
    super('Service is healthy', {
      service: service,
      version: version,
      status: status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}
