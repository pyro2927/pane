#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Family Pane Setup Verification\n');

let hasErrors = false;

function checkPassed(message) {
  console.log(`✅ ${message}`);
}

function checkFailed(message) {
  console.log(`❌ ${message}`);
  hasErrors = true;
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
}

// Check Node.js version
try {
  const nodeVersion = process.version;
  const expectedVersion = fs.readFileSync(path.join(__dirname, '..', '.nvmrc'), 'utf8').trim();
  
  if (nodeVersion === `v${expectedVersion}`) {
    checkPassed(`Node.js version: ${nodeVersion}`);
  } else {
    checkFailed(`Node.js version mismatch. Expected: v${expectedVersion}, Got: ${nodeVersion}`);
    console.log('   Run: nvm use');
  }
} catch (error) {
  checkFailed('Failed to check Node.js version');
}

// Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  const majorVersion = parseInt(npmVersion.split('.')[0]);
  
  if (majorVersion >= 9) {
    checkPassed(`npm version: ${npmVersion}`);
  } else {
    checkWarning(`npm version: ${npmVersion} (recommended: >=9.0.0)`);
  }
} catch (error) {
  checkFailed('Failed to check npm version');
}

// Check if dependencies are installed
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
  
  if (nodeModulesExists) {
    checkPassed('Dependencies installed (node_modules exists)');
  } else {
    checkFailed('Dependencies not installed. Run: npm install');
  }
} catch (error) {
  checkFailed('Failed to check dependencies');
}

// Check environment file
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (fs.existsSync(envPath)) {
  checkPassed('.env file exists');
  
  // Check if .env has been configured
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your_google_client_id_here')) {
    checkWarning('.env file needs configuration (contains placeholder values)');
  } else {
    checkPassed('.env file appears to be configured');
  }
} else if (fs.existsSync(envExamplePath)) {
  checkFailed('.env file missing. Copy from .env.example and configure');
} else {
  checkFailed('.env.example file missing');
}

// Check Google credentials
const credentialsPath = path.join(__dirname, '..', 'config', 'credentials.json');
if (fs.existsSync(credentialsPath)) {
  checkPassed('Google credentials file found');
  
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    if (credentials.web && credentials.web.client_id) {
      checkPassed('Google credentials appear valid');
    } else {
      checkWarning('Google credentials file format may be incorrect');
    }
  } catch (error) {
    checkWarning('Could not parse Google credentials file');
  }
} else {
  checkWarning('Google credentials file not found (config/credentials.json)');
  console.log('   This is required for Google Calendar and Photos integration');
}

// Check config directory
const configDir = path.join(__dirname, '..', 'config');
if (fs.existsSync(configDir)) {
  checkPassed('Config directory exists');
  
  // Check if directory is writable
  try {
    const testFile = path.join(configDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    checkPassed('Config directory is writable');
  } catch (error) {
    checkFailed('Config directory is not writable');
  }
} else {
  checkWarning('Config directory will be created automatically');
}

// Check project structure
const requiredDirs = [
  'server',
  'client/display',
  'client/display/css',
  'client/display/js'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(path.join(__dirname, '..', dir))) {
    checkPassed(`Directory exists: ${dir}`);
  } else {
    checkFailed(`Missing directory: ${dir}`);
  }
});

// Check key files
const requiredFiles = [
  'server/app.js',
  'client/display/index.html',
  'client/display/css/main.css',
  'client/display/js/app.js',
  '.gitignore',
  '.gitattributes',
  'jest.config.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, '..', file))) {
    checkPassed(`File exists: ${file}`);
  } else {
    checkFailed(`Missing file: ${file}`);
  }
});

// Check for security-sensitive patterns in .gitignore
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const securityPatterns = ['.env', '*.db', 'credentials.json', '*.key', '*.pem'];
  let missingPatterns = [];
  
  securityPatterns.forEach(pattern => {
    if (!gitignoreContent.includes(pattern)) {
      missingPatterns.push(pattern);
    }
  });
  
  if (missingPatterns.length === 0) {
    checkPassed('Security patterns present in .gitignore');
  } else {
    checkWarning(`Some security patterns missing from .gitignore: ${missingPatterns.join(', ')}`);
  }
}

// Final summary
console.log('\n📋 Summary:');
if (hasErrors) {
  console.log('❌ Setup has errors that need to be resolved');
  console.log('\nNext steps:');
  console.log('1. Fix the errors listed above');
  console.log('2. Run this script again to verify');
  console.log('3. Try starting the development server: npm run dev');
  process.exit(1);
} else {
  console.log('✅ Setup verification passed!');
  console.log('\nNext steps:');
  console.log('1. Configure .env file with your Google credentials');
  console.log('2. Place credentials.json in the config/ directory');
  console.log('3. Start the development server: npm run dev');
  console.log('4. Visit http://localhost:8080 to see the family pane');
  process.exit(0);
}