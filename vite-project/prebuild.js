/**
 * This script determines the correct build preparation script to run based on the platform
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Check if this is a Linux/Unix system
const isUnix = fs.existsSync('/bin/bash');

try {
  if (isUnix) {
    console.log('Linux environment detected, using shell script...');
    // Make shell script executable and run it
    execSync('chmod +x prepare-build.sh && ./prepare-build.sh', { stdio: 'inherit' });
  } else {
    console.log('Windows environment detected, using PowerShell script...');
    // Run PowerShell script
    execSync('powershell -ExecutionPolicy Bypass -File prepare-build.ps1', { stdio: 'inherit' });
  }
  console.log('Build preparation completed successfully.');
} catch (error) {
  console.error('Error during build preparation:', error.message);
  process.exit(1);
}
