import mongoose from 'mongoose';
import config from './config.js';

/**
 * Database Connection Class
 * Handles MongoDB connection with proper error handling
 */
class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      if (!config.mongodb.uri) {
        throw new Error('MONGODB_URI is not defined in environment variables.');
      }

      const options = {
        ...config.mongodb.options,
        dbName: config.mongodb.dbName
      };

      this.connection = await mongoose.connect(config.mongodb.uri, options);

      console.log(`✅ Database connected successfully to: ${config.mongodb.dbName}`);
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ Database connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ Database disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 Database reconnected');
      });

    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        console.log('✅ Database disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error.message);
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

export default new Database();
