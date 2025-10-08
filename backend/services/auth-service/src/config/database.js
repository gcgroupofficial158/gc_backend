import mongoose from 'mongoose';
import config from './config.js';

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      if (!config.mongodb.uri) {
        throw new Error('MONGODB_URI is not set. Please define it in your environment (.env).');
      }
      const options = {
        ...config.mongodb.options,
        dbName: config.mongodb.dbName
      };

      this.connection = await mongoose.connect(config.mongodb.uri, options);
      
      console.log(`✅ Database connected successfully to: ${config.mongodb.dbName}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ Database connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Database disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 Database reconnected');
      });

      return this.connection;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

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

  getConnection() {
    return this.connection;
  }
}

export default new Database();
