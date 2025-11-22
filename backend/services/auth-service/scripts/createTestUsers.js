import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

dotenv.config();

const createTestUsers = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete existing users first to avoid unique index conflicts
    const testEmails = ['user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com'];
    const deleteResult = await User.deleteMany({ email: { $in: testEmails } });
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing test user(s)`);
    }

    // Real users data
    const testUsers = [
      {
        firstName: 'User',
        lastName: 'One',
        email: 'user1@gmail.com',
        password: 'Password123',
        role: 'user',
        isActive: true,
        emailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      {
        firstName: 'User',
        lastName: 'Two',
        email: 'user2@gmail.com',
        password: 'Password123',
        role: 'user',
        isActive: true,
        emailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      {
        firstName: 'User',
        lastName: 'Three',
        email: 'user3@gmail.com',
        password: 'Password123',
        role: 'user',
        isActive: true,
        emailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
      }
    ];

    // Create or update test users
    for (const userData of testUsers) {
      try {
        // Try to find existing user
        let user = await User.findOne({ email: userData.email });
        
        if (user) {
          // Update existing user - set password directly (will be hashed by pre-save hook)
          user.firstName = userData.firstName;
          user.lastName = userData.lastName;
          user.password = userData.password; // Plain password - pre-save hook will hash it
          user.profilePicture = userData.profilePicture;
          user.isActive = true;
          user.emailVerified = true;
          user.provider = 'email';
          user.role = userData.role;
          await user.save(); // Pre-save hook will hash the password
          console.log(`✅ Updated user: ${userData.email} (ID: ${user._id})`);
        } else {
          // Create new user - pass plain password, pre-save hook will hash it
          user = await User.create({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password, // Plain password - pre-save hook will hash it
            profilePicture: userData.profilePicture,
            isActive: true,
            emailVerified: true,
            provider: 'email',
            role: userData.role
            // Don't set sessions - let it default
          });
          console.log(`✅ Created user: ${userData.email} (ID: ${user._id})`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userData.email}:`, error.message);
        // Continue with next user
      }
    }

    console.log('\n🎉 Test users created/updated successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: Password123`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createTestUsers();

