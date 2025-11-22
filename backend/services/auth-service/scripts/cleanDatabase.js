import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import Comment from '../src/models/Comment.js';
import Friend from '../src/models/Friend.js';

dotenv.config();

const cleanDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the 3 real users
    const realUsers = await User.find({
      email: { $in: ['user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com'] }
    });

    const realUserIds = realUsers.map(u => u._id);
    console.log(`📋 Found ${realUsers.length} real users:`, realUsers.map(u => u.email));

    // Delete all posts not from real users
    const postsResult = await Post.deleteMany({
      author: { $nin: realUserIds }
    });
    console.log(`🗑️  Deleted ${postsResult.deletedCount} posts from other users`);

    // Delete all comments on deleted posts or from non-real users
    const commentsResult = await Comment.deleteMany({
      $or: [
        { author: { $nin: realUserIds } },
        { post: { $nin: realUserIds } } // This will be handled by post deletion
      ]
    });
    console.log(`🗑️  Deleted ${commentsResult.deletedCount} comments from other users`);

    // Delete all friend relationships not involving real users
    const friendsResult = await Friend.deleteMany({
      $or: [
        { requester: { $nin: realUserIds } },
        { recipient: { $nin: realUserIds } }
      ]
    });
    console.log(`🗑️  Deleted ${friendsResult.deletedCount} friend relationships`);

    // Delete all users except the 3 real ones
    const usersResult = await User.deleteMany({
      email: { $nin: ['user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com'] }
    });
    console.log(`🗑️  Deleted ${usersResult.deletedCount} other users`);

    // Verify final state
    const finalUsers = await User.find();
    const finalPosts = await Post.find();
    const finalComments = await Comment.find();
    const finalFriends = await Friend.find();

    console.log('\n📊 Final Database State:');
    console.log(`   Users: ${finalUsers.length}`);
    console.log(`   Posts: ${finalPosts.length}`);
    console.log(`   Comments: ${finalComments.length}`);
    console.log(`   Friends: ${finalFriends.length}`);

    console.log('\n✅ Database cleaned! Only real users (user1, user2, user3) remain.');
    console.log('\n📋 Remaining Users:');
    finalUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

cleanDatabase();

