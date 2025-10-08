import cron from 'node-cron';
import SessionService from '../services/implementations/SessionService.js';

/**
 * Session Cleanup Job
 * Runs periodically to clean up expired sessions
 */
class SessionCleanupJob {
  constructor() {
    this.sessionService = new SessionService();
    this.isRunning = false;
  }

  /**
   * Start the session cleanup job
   * Runs every hour to clean expired sessions
   */
  start() {
    if (this.isRunning) {
      console.log('Session cleanup job is already running');
      return;
    }

    // Run every hour at minute 0
    this.job = cron.schedule('0 * * * *', async () => {
      await this.cleanupExpiredSessions();
    }, {
      scheduled: false
    });

    this.job.start();
    this.isRunning = true;
    console.log('✅ Session cleanup job started - runs every hour');
  }

  /**
   * Stop the session cleanup job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log('⏹️ Session cleanup job stopped');
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      console.log('🧹 Starting session cleanup...');
      const cleanedCount = await this.sessionService.cleanupExpiredSessions();
      console.log(`✅ Session cleanup completed - ${cleanedCount} expired sessions removed`);
    } catch (error) {
      console.error('❌ Session cleanup failed:', error.message);
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.job ? this.job.nextDate() : null
    };
  }
}

export default new SessionCleanupJob();
