/**
 * Profile Request Interfaces
 * Defines request data structures for profile operations
 */

/**
 * Profile Update Request
 */
export class ProfileUpdateRequest {
  constructor(data) {
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phone = data.phone;
    this.dateOfBirth = data.dateOfBirth;
    this.gender = data.gender;
    this.bio = data.bio;
    this.address = data.address;
    this.occupation = data.occupation;
    this.company = data.company;
    this.website = data.website;
    this.socialLinks = data.socialLinks;
    this.preferences = data.preferences;
  }

  /**
   * Validate profile update data
   */
  validate() {
    const errors = [];

    if (this.firstName && (this.firstName.length < 2 || this.firstName.length > 50)) {
      errors.push('First name must be between 2 and 50 characters');
    }

    if (this.lastName && (this.lastName.length < 2 || this.lastName.length > 50)) {
      errors.push('Last name must be between 2 and 50 characters');
    }

    if (this.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(this.phone)) {
      errors.push('Please provide a valid phone number');
    }

    if (this.dateOfBirth && new Date(this.dateOfBirth) >= new Date()) {
      errors.push('Date of birth must be in the past');
    }

    if (this.gender && !['male', 'female', 'other', 'prefer-not-to-say'].includes(this.gender)) {
      errors.push('Gender must be one of: male, female, other, prefer-not-to-say');
    }

    if (this.bio && this.bio.length > 500) {
      errors.push('Bio cannot exceed 500 characters');
    }

    if (this.website && !/^https?:\/\/.+/.test(this.website)) {
      errors.push('Please provide a valid website URL');
    }

    if (this.socialLinks) {
      const socialPlatforms = ['linkedin', 'twitter', 'github', 'instagram'];
      for (const platform of socialPlatforms) {
        if (this.socialLinks[platform] && !/^https?:\/\/.+/.test(this.socialLinks[platform])) {
          errors.push(`Please provide a valid ${platform} profile URL`);
        }
      }
    }

    if (this.preferences) {
      if (this.preferences.profileVisibility && 
          !['public', 'private', 'friends-only'].includes(this.preferences.profileVisibility)) {
        errors.push('Profile visibility must be one of: public, private, friends-only');
      }

      if (this.preferences.language && 
          !['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'].includes(this.preferences.language)) {
        errors.push('Invalid language code');
      }
    }

    return errors;
  }

  /**
   * Get sanitized data
   */
  getSanitizedData() {
    const data = {};
    
    if (this.firstName) data.firstName = this.firstName.trim();
    if (this.lastName) data.lastName = this.lastName.trim();
    if (this.phone) data.phone = this.phone.trim();
    if (this.dateOfBirth) data.dateOfBirth = new Date(this.dateOfBirth);
    if (this.gender) data.gender = this.gender;
    if (this.bio) data.bio = this.bio.trim();
    if (this.occupation) data.occupation = this.occupation.trim();
    if (this.company) data.company = this.company.trim();
    if (this.website) data.website = this.website.trim();
    
    if (this.address) {
      data.address = {};
      if (this.address.street) data.address.street = this.address.street.trim();
      if (this.address.city) data.address.city = this.address.city.trim();
      if (this.address.state) data.address.state = this.address.state.trim();
      if (this.address.country) data.address.country = this.address.country.trim();
      if (this.address.postalCode) data.address.postalCode = this.address.postalCode.trim();
    }
    
    if (this.socialLinks) {
      data.socialLinks = {};
      if (this.socialLinks.linkedin) data.socialLinks.linkedin = this.socialLinks.linkedin.trim();
      if (this.socialLinks.twitter) data.socialLinks.twitter = this.socialLinks.twitter.trim();
      if (this.socialLinks.github) data.socialLinks.github = this.socialLinks.github.trim();
      if (this.socialLinks.instagram) data.socialLinks.instagram = this.socialLinks.instagram.trim();
    }
    
    if (this.preferences) {
      data.preferences = {};
      if (this.preferences.emailNotifications !== undefined) {
        data.preferences.emailNotifications = Boolean(this.preferences.emailNotifications);
      }
      if (this.preferences.smsNotifications !== undefined) {
        data.preferences.smsNotifications = Boolean(this.preferences.smsNotifications);
      }
      if (this.preferences.profileVisibility) {
        data.preferences.profileVisibility = this.preferences.profileVisibility;
      }
      if (this.preferences.language) {
        data.preferences.language = this.preferences.language;
      }
      if (this.preferences.timezone) {
        data.preferences.timezone = this.preferences.timezone.trim();
      }
    }

    return data;
  }
}

/**
 * Document Upload Request
 */
export class DocumentUploadRequest {
  constructor(data) {
    this.name = data.name;
    this.type = data.type;
  }

  /**
   * Validate document upload data
   */
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Document name is required');
    } else if (this.name.length > 100) {
      errors.push('Document name cannot exceed 100 characters');
    }

    if (!this.type || !['resume', 'certificate', 'portfolio', 'other'].includes(this.type)) {
      errors.push('Document type must be one of: resume, certificate, portfolio, other');
    }

    return errors;
  }

  /**
   * Get sanitized data
   */
  getSanitizedData() {
    return {
      name: this.name.trim(),
      type: this.type
    };
  }
}

/**
 * Search Request
 */
export class SearchRequest {
  constructor(data) {
    this.query = data.q || data.query;
    this.limit = parseInt(data.limit) || 20;
    this.page = parseInt(data.page) || 1;
    this.filters = data.filters || {};
  }

  /**
   * Validate search data
   */
  validate() {
    const errors = [];

    if (!this.query || this.query.trim().length === 0) {
      errors.push('Search query is required');
    } else if (this.query.length > 100) {
      errors.push('Search query cannot exceed 100 characters');
    }

    if (this.limit < 1 || this.limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }

    if (this.page < 1) {
      errors.push('Page must be a positive integer');
    }

    return errors;
  }

  /**
   * Get sanitized data
   */
  getSanitizedData() {
    return {
      query: this.query.trim(),
      limit: Math.min(Math.max(this.limit, 1), 100),
      page: Math.max(this.page, 1),
      filters: this.filters
    };
  }
}

/**
 * Pagination Request
 */
export class PaginationRequest {
  constructor(data) {
    this.page = parseInt(data.page) || 1;
    this.limit = parseInt(data.limit) || 10;
    this.sort = data.sort || 'createdAt';
    this.order = data.order || 'desc';
    this.filters = data.filters || {};
  }

  /**
   * Validate pagination data
   */
  validate() {
    const errors = [];

    if (this.page < 1) {
      errors.push('Page must be a positive integer');
    }

    if (this.limit < 1 || this.limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }

    const allowedSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'lastProfileUpdate'];
    if (!allowedSortFields.includes(this.sort)) {
      errors.push(`Sort field must be one of: ${allowedSortFields.join(', ')}`);
    }

    if (!['asc', 'desc'].includes(this.order)) {
      errors.push('Order must be asc or desc');
    }

    return errors;
  }

  /**
   * Get sanitized data
   */
  getSanitizedData() {
    return {
      page: Math.max(this.page, 1),
      limit: Math.min(Math.max(this.limit, 1), 100),
      sort: { [this.sort]: this.order === 'asc' ? 1 : -1 },
      filters: this.filters
    };
  }
}
