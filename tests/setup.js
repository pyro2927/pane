// Jest setup file
const fs = require('fs');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:'; // Use in-memory database for tests
process.env.PORT = '0'; // Let system assign available port

// Clean up test database before each test file
beforeEach(() => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  const testDbPath = path.join(fixturesDir, 'test.db');
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
      // Ignore permission errors during cleanup
    }
  }
});

// Global test utilities
global.testUtils = {
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    color: '#2196F3',
    role: 'member',
    ...overrides
  }),

  createTestChore: (overrides = {}) => ({
    title: 'Test Chore',
    description: 'Test chore description',
    assigned_to: 1,
    priority: 'normal',
    category: 'general',
    points: 1,
    ...overrides
  }),

  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Suppress console.log in tests unless explicitly enabled
if (!process.env.JEST_VERBOSE) {
  console.log = jest.fn();
  console.info = jest.fn();
}

// Keep error and warn for debugging
console.error = jest.fn();
console.warn = jest.fn();