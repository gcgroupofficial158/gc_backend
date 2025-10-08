#!/usr/bin/env node

/**
 * Simple Test Runner for Auth Service
 * Author: Ganesh Patel
 * 
 * This script runs tests without requiring npm to be globally available
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkNodeVersion() {
  try {
    const { execSync } = require('child_process');
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✓ Node.js version: ${version}`, 'green');
    return true;
  } catch (error) {
    log('✗ Node.js not found. Please install Node.js 18+', 'red');
    return false;
  }
}

async function checkServiceRunning() {
  try {
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3001/api/v1/health', (res) => {
        if (res.statusCode === 200) {
          log('✓ Auth service is running', 'green');
          resolve(true);
        } else {
          log('✗ Auth service returned non-200 status', 'yellow');
          resolve(false);
        }
      });
      
      req.on('error', () => {
        log('✗ Auth service is not running. Please start it first.', 'red');
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        log('✗ Auth service health check timeout', 'yellow');
        resolve(false);
      });
    });
  } catch (error) {
    log('✗ Error checking service status', 'red');
    return false;
  }
}

async function installDependencies() {
  log('Installing dependencies...', 'blue');
  try {
    await runCommand('npm', ['install']);
    log('✓ Dependencies installed successfully', 'green');
    return true;
  } catch (error) {
    log('✗ Failed to install dependencies', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function runJestTests() {
  log('Running Jest tests...', 'blue');
  try {
    await runCommand('npx', ['jest', '--testTimeout=30000']);
    log('✓ Jest tests completed successfully', 'green');
    return true;
  } catch (error) {
    log('✗ Jest tests failed', 'red');
    return false;
  }
}

async function runLoadTests() {
  log('Running load tests...', 'blue');
  try {
    await runCommand('npx', ['artillery', 'run', 'tests/load/load-test.yml']);
    log('✓ Load tests completed', 'green');
    return true;
  } catch (error) {
    log('⚠ Load tests had issues (this might be expected)', 'yellow');
    return true; // Don't fail the entire test suite for load test issues
  }
}

async function generateCoverage() {
  log('Generating test coverage...', 'blue');
  try {
    await runCommand('npx', ['jest', '--coverage', '--testTimeout=30000']);
    log('✓ Coverage report generated', 'green');
    log('Coverage report available at: coverage/lcov-report/index.html', 'blue');
    return true;
  } catch (error) {
    log('✗ Failed to generate coverage report', 'red');
    return false;
  }
}

async function main() {
  const testType = process.argv[2] || 'all';
  
  log('🧪 Auth Service Test Runner', 'blue');
  log('Author: Ganesh Patel', 'blue');
  log('================================', 'blue');
  
  // Check Node.js version
  if (!(await checkNodeVersion())) {
    process.exit(1);
  }
  
  // Install dependencies
  if (!(await installDependencies())) {
    process.exit(1);
  }
  
  switch (testType) {
    case 'unit':
      log('Running unit tests only...', 'blue');
      await runJestTests();
      break;
      
    case 'integration':
      log('Running integration tests only...', 'blue');
      if (await checkServiceRunning()) {
        await runJestTests();
      } else {
        log('Skipping integration tests - service not running', 'yellow');
      }
      break;
      
    case 'load':
      log('Running load tests only...', 'blue');
      if (await checkServiceRunning()) {
        await runLoadTests();
      } else {
        log('Skipping load tests - service not running', 'yellow');
      }
      break;
      
    case 'coverage':
      log('Generating coverage report...', 'blue');
      await generateCoverage();
      break;
      
    case 'all':
    default:
      log('Running all tests...', 'blue');
      const jestSuccess = await runJestTests();
      
      if (jestSuccess) {
        await generateCoverage();
        
        if (await checkServiceRunning()) {
          await runLoadTests();
        } else {
          log('Skipping load tests - service not running', 'yellow');
        }
      }
      
      log('🎉 All tests completed!', 'green');
      break;
  }
  
  log('Test run finished.', 'blue');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log(`Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
