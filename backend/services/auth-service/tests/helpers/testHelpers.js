import jwt from 'jsonwebtoken';
import config from '../../src/config/config.js';

export class TestHelpers {
  /**
   * Generate a test JWT token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {string} expiresIn - Token expiration
   * @returns {string} JWT token
   */
  static generateToken(payload, secret = config.jwt.secret, expiresIn = '1h') {
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Generate a test refresh token
   * @param {Object} payload - Token payload
   * @returns {string} Refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, { 
      expiresIn: config.jwt.refreshExpiresIn 
    });
  }

  /**
   * Create authorization header
   * @param {string} token - JWT token
   * @returns {Object} Authorization header
   */
  static createAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after the delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random string
   * @param {number} length - String length
   * @returns {string} Random string
   */
  static randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random email
   * @returns {string} Random email
   */
  static randomEmail() {
    return `test-${this.randomString(8)}@example.com`;
  }

  /**
   * Validate response structure
   * @param {Object} response - Response object
   * @param {Object} expected - Expected structure
   * @returns {boolean} Is valid
   */
  static validateResponse(response, expected) {
    const { body, status } = response;
    
    if (expected.status && status !== expected.status) {
      return false;
    }
    
    if (expected.hasSuccess !== undefined && body.success !== expected.hasSuccess) {
      return false;
    }
    
    if (expected.hasData && !body.data) {
      return false;
    }
    
    if (expected.hasErrors && !body.errors) {
      return false;
    }
    
    return true;
  }

  /**
   * Create test user in database
   * @param {Object} userData - User data
   * @param {Object} User - User model
   * @returns {Promise<Object>} Created user
   */
  static async createTestUser(userData, User) {
    const user = new User(userData);
    await user.save();
    return user;
  }

  /**
   * Clean up test data
   * @param {Object} collections - Mongoose collections
   * @returns {Promise} Cleanup promise
   */
  static async cleanupTestData(collections) {
    const cleanupPromises = Object.values(collections).map(collection => 
      collection.deleteMany({})
    );
    await Promise.all(cleanupPromises);
  }

  /**
   * Mock console methods to prevent test output
   */
  static mockConsole() {
    const originalConsole = { ...console };
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    
    return originalConsole;
  }

  /**
   * Restore console methods
   * @param {Object} originalConsole - Original console object
   */
  static restoreConsole(originalConsole) {
    Object.assign(console, originalConsole);
  }

  /**
   * Generate test scenarios
   * @param {Array} scenarios - Array of scenario objects
   * @returns {Array} Test scenarios
   */
  static generateTestScenarios(scenarios) {
    return scenarios.map((scenario, index) => ({
      ...scenario,
      name: scenario.name || `Test Scenario ${index + 1}`,
      description: scenario.description || `Test scenario ${index + 1}`
    }));
  }

  /**
   * Create rate limit test data
   * @param {number} requests - Number of requests
   * @param {number} interval - Interval in milliseconds
   * @returns {Array} Array of request functions
   */
  static createRateLimitTest(requests, interval = 100) {
    const requestFunctions = [];
    
    for (let i = 0; i < requests; i++) {
      requestFunctions.push(() => this.delay(i * interval));
    }
    
    return requestFunctions;
  }

  /**
   * Validate JWT token
   * @param {string} token - JWT token
   * @param {string} secret - JWT secret
   * @returns {Object} Decoded token or null
   */
  static validateToken(token, secret = config.jwt.secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create test database connection
   * @param {string} uri - MongoDB URI
   * @returns {Promise<Object>} Database connection
   */
  static async createTestConnection(uri) {
    const mongoose = await import('mongoose');
    return mongoose.default.connect(uri);
  }

  /**
   * Close test database connection
   * @returns {Promise} Close promise
   */
  static async closeTestConnection() {
    const mongoose = await import('mongoose');
    return mongoose.default.connection.close();
  }
}

export default TestHelpers;
