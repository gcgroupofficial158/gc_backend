import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT,
  // For Render and production: bind to 0.0.0.0 to accept external connections
  // For local dev: use localhost
  // Always use 0.0.0.0 if HOST is not explicitly set (for cloud deployments)
  host: process.env.HOST,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration
  mongodb: {
    // Always read from environment; do not hardcode credentials here
    uri: process.env.MONGODB_URI,
    dbName: process.env.DB_NAME || 'gc_group',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  // Password Configuration
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },

  // Rate Limiting - Very lenient for testing
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 100000 : 10000) // Very high limit: 10000 requests per 15 minutes for production/testing
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? (process.env.CORS_ORIGIN.includes(',') 
          ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
          : process.env.CORS_ORIGIN.trim())
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

export default config;
