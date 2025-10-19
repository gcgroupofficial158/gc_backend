import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import ProfileService from '../../src/services/implementations/ProfileService.js';
import User from '../../src/models/User.js';
import { createTestUser, createTestProfileUpdate } from '../fixtures/testData.js';

describe('Profile Service Unit Tests', () => {
  let mongoServer;
  let profileService;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    profileService = new ProfileService();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('getProfile', () => {
    test('should get user profile successfully', async () => {
      const userData = createTestUser();
      const user = await User.create(userData);

      const profile = await profileService.getProfile(user._id.toString(), true);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(user._id.toString());
      expect(profile.firstName).toBe(user.firstName);
      expect(profile.lastName).toBe(user.lastName);
      expect(profile.email).toBe(user.email);
    });

    test('should return public profile for non-owner', async () => {
      const userData = createTestUser();
      const user = await User.create(userData);

      const profile = await profileService.getProfile(user._id.toString(), false);

      expect(profile).toBeDefined();
      expect(profile.id).toBe(user._id.toString());
      expect(profile.firstName).toBe(user.firstName);
      expect(profile.lastName).toBe(user.lastName);
      // Email should not be included in public profile
      expect(profile.email).toBeUndefined();
    });

    test('should throw error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(profileService.getProfile(nonExistentId, true))
        .rejects.toThrow('User profile not found');
    });
  });

  describe('updateProfile', () => {
    test('should update user profile successfully', async () => {
      const userData = createTestUser();
      const user = await User.create(userData);

      const updateData = createTestProfileUpdate();
      const result = await profileService.updateProfile(user._id.toString(), updateData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.firstName).toBe(updateData.firstName);
      expect(result.data.lastName).toBe(updateData.lastName);
    });

    test('should validate profile update data', async () => {
      const userData = createTestUser();
      const user = await User.create(userData);

      const invalidUpdateData = {
        firstName: 'A', // Too short
        lastName: 'B', // Too short
        bio: 'x'.repeat(501) // Too long
      };

      await expect(profileService.updateProfile(user._id.toString(), invalidUpdateData))
        .rejects.toThrow('Validation failed');
    });

    test('should throw error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updateData = createTestProfileUpdate();

      await expect(profileService.updateProfile(nonExistentId, updateData))
        .rejects.toThrow('User profile not found');
    });
  });

  describe('searchProfiles', () => {
    beforeEach(async () => {
      // Create test users
      const users = [
        createTestUser({ firstName: 'John', lastName: 'Doe', occupation: 'Developer' }),
        createTestUser({ firstName: 'Jane', lastName: 'Smith', occupation: 'Designer' }),
        createTestUser({ firstName: 'Bob', lastName: 'Johnson', occupation: 'Manager' })
      ];

      for (const userData of users) {
        await User.create(userData);
      }
    });

    test('should search profiles by name', async () => {
      const result = await profileService.searchProfiles('John');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].firstName).toBe('John');
    });

    test('should search profiles by occupation', async () => {
      const result = await profileService.searchProfiles('Developer');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].occupation).toBe('Developer');
    });

    test('should return empty results for no matches', async () => {
      const result = await profileService.searchProfiles('NonExistent');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(0);
    });
  });

  describe('getProfiles', () => {
    beforeEach(async () => {
      // Create test users
      const users = Array.from({ length: 15 }, () => createTestUser());
      for (const userData of users) {
        await User.create(userData);
      }
    });

    test('should get profiles with pagination', async () => {
      const result = await profileService.getProfiles({}, { page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.profiles).toHaveLength(10);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(15);
    });

    test('should filter profiles by occupation', async () => {
      const occupation = 'Developer';
      const result = await profileService.getProfiles({ occupation: new RegExp(occupation, 'i') }, { page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.profiles).toBeDefined();
    });
  });

  describe('createProfile', () => {
    test('should create profile successfully', async () => {
      const userData = createTestUser();

      const result = await profileService.createProfile(userData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result.email).toBe(userData.email);
    });

    test('should throw error for duplicate email', async () => {
      const userData = createTestUser();
      await User.create(userData);

      await expect(profileService.createProfile(userData))
        .rejects.toThrow('Profile already exists for this user');
    });
  });

  describe('deleteProfile', () => {
    test('should delete profile successfully', async () => {
      const userData = createTestUser();
      const user = await User.create(userData);

      const result = await profileService.deleteProfile(user._id.toString());

      expect(result).toBe(true);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    test('should return false for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const result = await profileService.deleteProfile(nonExistentId);

      expect(result).toBe(false);
    });
  });
});
