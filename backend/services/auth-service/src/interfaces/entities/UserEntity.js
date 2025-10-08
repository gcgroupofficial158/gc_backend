/**
 * User Entity Interface
 * Defines the structure and contract for User entities
 */
class UserEntity {
  constructor(data) {
    this.id = data.id;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.phone = data.phone;
    this.role = data.role;
    this.isActive = data.isActive;
    this.isEmailVerified = data.isEmailVerified;
    this.lastLogin = data.lastLogin;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Getters
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get isLocked() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  }

  // Methods
  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      role: this.role,
      isActive: this.isActive,
      isEmailVerified: this.isEmailVerified,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Validation methods
  isValid() {
    return !!(this.firstName && this.lastName && this.email);
  }

  hasRole(role) {
    return this.role === role;
  }

  isAdmin() {
    return this.role === 'admin';
  }

  isModerator() {
    return this.role === 'moderator' || this.role === 'admin';
  }
}

export default UserEntity;
