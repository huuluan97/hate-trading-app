#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${description}...`, colors.blue);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed successfully`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

function checkRequirements() {
  log('🔍 Checking build requirements...', colors.cyan);

  // Check if we're on macOS for macOS builds
  const { platform } = process;
  log(`Platform: ${platform}`, colors.yellow);

  // Check Node.js version
  const { version: nodeVersion } = process;
  log(`Node.js version: ${nodeVersion}`, colors.yellow);

  // Check if electron-builder is installed
  try {
    execSync('npx electron-builder --version', { stdio: 'pipe' });
    log('✅ electron-builder is available', colors.green);
  } catch {
    log('❌ electron-builder not found', colors.red);
    return false;
  }

  return true;
}

function createReleaseFolder() {
  const releaseDir = path.join(process.cwd(), 'release', 'build');
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
    log(`📁 Created release directory: ${releaseDir}`, colors.green);
  }
}

function buildForPlatform(platform) {
  const commands = {
    mac: 'npm run package:mac',
    win: 'npm run package:win',
    linux: 'npm run package:linux',
    all: 'npm run package:all',
  };

  const descriptions = {
    mac: 'Building for macOS (Intel & Apple Silicon)',
    win: 'Building for Windows (x64 & x32)',
    linux: 'Building for Linux (AppImage)',
    all: 'Building for all platforms',
  };

  if (!commands[platform]) {
    log(`❌ Unknown platform: ${platform}`, colors.red);
    log('Available platforms: mac, win, linux, all', colors.yellow);
    return false;
  }

  return execCommand(commands[platform], descriptions[platform]);
}

function showBuildResults() {
  const buildDir = path.join(process.cwd(), 'release', 'build');

  if (fs.existsSync(buildDir)) {
    log('\n📦 Build results:', colors.magenta);
    const files = fs.readdirSync(buildDir);
    files.forEach((file) => {
      const filePath = path.join(buildDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      log(`  • ${file} (${size} MB)`, colors.cyan);
    });
  }
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'all';

  log('🚀 Trading App Build Script', colors.magenta);
  log('==============================', colors.magenta);

  if (!checkRequirements()) {
    process.exit(1);
  }

  createReleaseFolder();

  log(`\n🔨 Starting build for: ${platform}`, colors.cyan);

  // Clean previous builds
  if (!execCommand('npm run lint', 'Running linter')) {
    log('⚠️  Linter found issues, but continuing build...', colors.yellow);
  }

  // Build the application
  const success = buildForPlatform(platform);

  if (success) {
    showBuildResults();
    log('\n🎉 Build completed successfully!', colors.green);
    log('\n📖 Usage instructions:', colors.cyan);
    log('  • macOS: Install the .dmg file or extract the .zip', colors.reset);
    log(
      '  • Windows: Run the .exe installer or use the portable version',
      colors.reset,
    );
    log('  • Linux: Run the .AppImage file', colors.reset);
  } else {
    log('\n💥 Build failed!', colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildForPlatform, checkRequirements };
