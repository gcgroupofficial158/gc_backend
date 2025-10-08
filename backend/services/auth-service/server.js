/**
 * Auth Service Server
 * Entry point for the authentication microservice
 * Author: Ganesh Patel
 */

import app from './src/app.js';

// Start the application
app.start().catch((error) => {
  console.error('Failed to start auth service:', error);
  process.exit(1);
});
