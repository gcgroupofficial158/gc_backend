import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../../src/models/User.js';
import { validUserData, invalidUserData } from '../../fixtures/testData.js';

describe('User Model Unit Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a valid user', async () => {
      // Arrange
      const userData = { ...validUserData };

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      expect(user._id).toBeDefined();
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(false);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      // Arrange
      const userData = { ...validUserData };
      const originalPassword = userData.password;

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      expect(user.password).not.toBe(originalPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should not hash password if not modified', async () => {
      // Arrange
      const userData = { ...validUserData };
      const user = new User(userData);
      await user.save();
      const originalHashedPassword = user.password;

      // Act
      user.firstName = 'Updated Name';
      await user.save();

      // Assert
      expect(user.password).toBe(originalHashedPassword);
    });

    it('should validate required fields', async () => {
      // Arrange
      const userData = {};

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      // Arrange
      const userData = { ...validUserData, email: 'invalid-email' };

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate password length', async () => {
      // Arrange
      const userData = { ...validUserData, password: '123' };

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate phone format', async () => {
      // Arrange
      const userData = { ...validUserData, phone: 'invalid-phone' };

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate role enum', async () => {
      // Arrange
      const userData = { ...validUserData, role: 'invalid-role' };

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      // Arrange
      const userData1 = { ...validUserData, email: 'test@example.com' };
      const userData2 = { ...validUserData, email: 'test@example.com' };

      // Act
      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Virtuals', () => {
    it('should return full name', () => {
      // Arrange
      const userData = { ...validUserData };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.fullName).toBe(`${userData.firstName} ${userData.lastName}`);
    });

    it('should return locked status', () => {
      // Arrange
      const userData = { ...validUserData };
      const user = new User(userData);

      // Act & Assert
      expect(user.isLocked).toBe(false);

      // Test locked status
      user.lockUntil = new Date(Date.now() + 60000); // 1 minute from now
      expect(user.isLocked).toBe(true);

      user.lockUntil = new Date(Date.now() - 60000); // 1 minute ago
      expect(user.isLocked).toBe(false);
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      const userData = { ...validUserData };
      user = new User(userData);
      await user.save();
    });

    it('should compare password correctly', async () => {
      // Arrange
      const correctPassword = validUserData.password;
      const incorrectPassword = 'wrongpassword';

      // Act & Assert
      const isCorrectPassword = await user.comparePassword(correctPassword);
      const isIncorrectPassword = await user.comparePassword(incorrectPassword);

      expect(isCorrectPassword).toBe(true);
      expect(isIncorrectPassword).toBe(false);
    });

    it('should increment login attempts', async () => {
      // Arrange
      const initialAttempts = user.loginAttempts;

      // Act
      await user.incLoginAttempts();

      // Assert
      expect(user.loginAttempts).toBe(initialAttempts + 1);
    });

    it('should reset login attempts', async () => {
      // Arrange
      user.loginAttempts = 5;
      user.lockUntil = new Date(Date.now() + 60000);
      await user.save();

      // Act
      await user.resetLoginAttempts();

      // Assert
      expect(user.loginAttempts).toBe(0);
      expect(user.lockUntil).toBeUndefined();
    });

    it('should lock account after 5 failed attempts', async () => {
      // Arrange
      user.loginAttempts = 4;

      // Act
      await user.incLoginAttempts();

      // Assert
      expect(user.loginAttempts).toBe(5);
      expect(user.lockUntil).toBeDefined();
      expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('User Statics', () => {
    beforeEach(async () => {
      const userData = { ...validUserData };
      const user = new User(userData);
      await user.save();
    });

    it('should find user by email', async () => {
      // Arrange
      const email = validUserData.email;

      // Act
      const foundUser = await User.findByEmail(email);

      // Assert
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(email);
      expect(foundUser.password).toBeUndefined(); // Should be excluded
    });

    it('should find active users', async () => {
      // Arrange
      const activeUser = new User({ ...validUserData, email: 'active@example.com' });
      const inactiveUser = new User({ 
        ...validUserData, 
        email: 'inactive@example.com', 
        isActive: false 
      });
      await activeUser.save();
      await inactiveUser.save();

      // Act
      const activeUsers = await User.findActive();

      // Assert
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].email).toBe('active@example.com');
    });
  });

  describe('User Indexes', () => {
    it('should have email index', async () => {
      // Arrange
      const userData = { ...validUserData };

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      const indexes = await User.collection.getIndexes();
      expect(indexes).toHaveProperty('email_1');
    });

    it('should have createdAt index', async () => {
      // Arrange
      const userData = { ...validUserData };

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      const indexes = await User.collection.getIndexes();
      expect(indexes).toHaveProperty('createdAt_-1');
    });

    it('should have isActive index', async () => {
      // Arrange
      const userData = { ...validUserData };

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      const indexes = await User.collection.getIndexes();
      expect(indexes).toHaveProperty('isActive_1');
    });
  });

  describe('User Timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      // Arrange
      const userData = { ...validUserData };

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toEqual(user.updatedAt);
    });

    it('should update updatedAt on modification', async () => {
      // Arrange
      const userData = { ...validUserData };
      const user = new User(userData);
      await user.save();
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Act
      user.firstName = 'Updated Name';
      await user.save();

      // Assert
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
